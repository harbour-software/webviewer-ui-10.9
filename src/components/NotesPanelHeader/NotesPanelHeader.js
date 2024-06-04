import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';
import debounce from 'lodash/debounce';
import selectors from 'selectors';
import actions from 'actions';
import classNames from 'classnames';
import core from 'core';

import Dropdown from 'components/Dropdown';
import Button from 'components/Button';
import DataElementWrapper from 'components/DataElementWrapper';
import CustomElement from 'components/CustomElement';

import Events from 'constants/events';
import { getSortStrategies } from 'constants/sortStrategies';
import DataElements from 'src/constants/dataElement';

import DatePicker from 'react-datepicker';
// https://github.com/glennflanagan/react-collapsible
import Collapsible from 'react-collapsible';

import './NotesPanelHeader.scss';

const SORT_CONTAINER_ELEMENT = 'sortContainer';

function NotesPanelHeader({
  notes,
  disableFilterAnnotation,
  setSearchInputHandler,
  isMultiSelectMode,
  toggleMultiSelectMode,
  isMultiSelectEnabled,
}) {
  const [
    sortStrategy,
    isSortContainerDisabled,
    customHeaderOptions,
    annotationFilters,
  ] = useSelector(
    (state) => [
      selectors.getSortStrategy(state),
      selectors.isElementDisabled(state, SORT_CONTAINER_ELEMENT),
      selectors.getNotesPanelCustomHeaderOptions(state),
      selectors.getAnnotationFilters(state)
    ],
    shallowEqual
  );

  const [t] = useTranslation();
  const dispatch = useDispatch();
  const [filterEnabled, setFilterEnabled] = useState(false);
  const [startDate, setStartDate] = useState();
  const _annotHistoryDtpOnChange = date => {
    setStartDate(date)
    let evt = new CustomEvent('annotHistoryDateSelected', { detail: date });
    window.dispatchEvent(evt);
    //console.log(`This is from _annotHistoryDtpOnChange: ${date}`)
  }

  useEffect(() => {
    // check if Redux filter state is enabled on mount and set filterEnabled to true
    const { authorFilter, colorFilter, statusFilter, typeFilter } = annotationFilters;
    if (authorFilter?.length > 0 || colorFilter?.length > 0 || statusFilter?.length > 0 || typeFilter?.length > 0) {
      setFilterEnabled(true);
    }

    const toggleFilterStyle = (e) => {
      const { types, authors, colors, statuses } = e.detail;
      if (types.length > 0 || authors.length > 0 || colors.length > 0 || statuses.length > 0) {
        setFilterEnabled(true);
      } else {
        setFilterEnabled(false);
      }
    };

    window.addEventListener(Events.ANNOTATION_FILTER_CHANGED, toggleFilterStyle);
    return () => {
      window.removeEventListener(Events.ANNOTATION_FILTER_CHANGED, toggleFilterStyle);
    };
  }, []);

  const handleInputChange = (e) => {
    _handleInputChange(e.target.value);
  };

  const _handleInputChange = debounce((value) => {
    // this function is used to solve the issue with using synthetic event asynchronously.
    // https://reactjs.org/docs/events.html#event-pooling
    core.deselectAllAnnotations();
    setSearchInputHandler(value);
  }, 500);

  const sortContainer = (
    <div className="sort-container" data-element={SORT_CONTAINER_ELEMENT}>
      <div className="label">{`${t('message.sortBy')}:`}</div>
      <Dropdown
        dataElement="notesOrderDropdown"
        disabled={notes.length === 0}
        items={Object.keys(getSortStrategies())}
        translationPrefix="option.notesOrder"
        currentSelectionKey={sortStrategy}
        onClickItem={(strategy) => {
          dispatch(actions.setNotesPanelSortStrategy(strategy));
        }}
      />
    </div>
  );

  const collapsedHeaderElement = (
    <Collapsible trigger="History / Search">
      <span className="label">History:&nbsp;</span>

      <div className="input-container">
        <DatePicker 
          id="annotHistoryDtp"
          selected={startDate}
          showTimeSelect
          timeIntervals={15}
          dateFormat="dd/MM/yyyy h:mm aa"
          isClearable
          placeholderText="Select a date to view annotation history"
          portalId="notesPanelHeader"
          onChange={(date) => _annotHistoryDtpOnChange(date)}
        />
      </div>
      <br />

      <span className="label">Search:&nbsp;</span>
      <DataElementWrapper
        className="input-container"
        dataElement={`${DataElements.NotesPanel.DefaultHeader.INPUT_CONTAINER}`}>
        <input
          type="text"
          placeholder={t('message.searchCommentsPlaceholder')}
          aria-label={t('message.searchCommentsPlaceholder')}
          onChange={handleInputChange}
          id="NotesPanel__input"
        />
      </DataElementWrapper>
    </Collapsible>
  );

  const originalHeaderElement = (
    <DataElementWrapper
      className="header"
      dataElement="notesPanelHeader">

      { collapsedHeaderElement }

      <DataElementWrapper
        className="comments-counter"
        dataElement={`${DataElements.NotesPanel.DefaultHeader.COMMENTS_COUNTER}`}>
        <span className='main-comment'>{t('component.notesPanel')}</span> {`(${notes.length})`}
      </DataElementWrapper>

      <DataElementWrapper
        className="sort-row"
        dataElement={`${DataElements.NotesPanel.DefaultHeader.SORT_ROW}`}>
        {(isSortContainerDisabled) ? <div className="sort-container"></div> : sortContainer}
        <div
          className="buttons-container"
        >
          <Button
            dataElement="hideShowNotesButton"
            className="hide-show-notes-button"
            title="Toggle Annotations"
            img="icon-header-chat-fill"
          />
          {(!isMultiSelectEnabled) ? null :
            <Button
              dataElement={DataElements.NOTE_MULTI_SELECT_MODE_BUTTON}
              className={classNames({
                active: isMultiSelectMode,
              })}
              disabled={notes.length === 0}
              img="icon-annotation-select-multiple"
              onClick={() => {
                core.deselectAllAnnotations();
                toggleMultiSelectMode();
              }}
              title={t('component.multiSelectButton')}
            />
          }
          <Button
            dataElement="filterAnnotationButton"
            className={classNames({
              filterAnnotationButton: true,
              active: filterEnabled
            })}
            disabled={disableFilterAnnotation}
            img="icon-comments-filter"
            onClick={() => dispatch(actions.openElement('filterModal'))}
            title={t('component.filter')}
          />
        </div>
      </DataElementWrapper>
    </DataElementWrapper>
  );

  return (
    <>
      {customHeaderOptions &&
        <CustomElement
          render={customHeaderOptions.render}
          renderArguments={[notes]}
        />
      }

      {(!customHeaderOptions || !customHeaderOptions.overwriteDefaultHeader) &&
        originalHeaderElement
      }
    </>
  );
}

export default NotesPanelHeader;
