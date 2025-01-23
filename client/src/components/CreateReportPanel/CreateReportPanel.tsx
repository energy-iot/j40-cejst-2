import React, {useEffect, useState} from 'react';
import {MapGeoJSONFeature} from 'maplibre-gl';
import {Button, Alert, Grid} from '@trussworks/react-uswds';
import * as styles from './CreateReportPanel.module.scss';

import * as constants from '../../data/constants';

// @ts-ignore
import deleteIcon from '/node_modules/uswds/dist/img/usa-icons/close.svg';

interface ICreateReportPanel {
  deleteTractHandler: (feature: MapGeoJSONFeature) => void,
  className: string,
  exitHandler: () => void,
  featureList: MapGeoJSONFeature[],
  maxNumTracts: number,
  showTooManyTractsAlert: boolean,
}

const CreateReportPanel = ({
  className,
  featureList,
  maxNumTracts,
  showTooManyTractsAlert,
  deleteTractHandler,
  exitHandler,
}: ICreateReportPanel,
) => {
  const [numPrevTracts, setNumPrevTracts] = useState<number>(0);

  useEffect(() => {
    // If adding a tract then scroll to the bottom of the tract list to always show the last added tract
    if (numPrevTracts < featureList.length) {
      const container = document.getElementById('j40-create-report-tract-list');
      if (container) container.scrollTop = container.scrollHeight;
    }
    setNumPrevTracts(featureList.length);
  }, [featureList, numPrevTracts]);

  /**
   * Handle the creation of a report.
   */
  const handleCreateReport = () => {
    if (featureList.length === 1) {
      // TODO: One tract report
    } else {
      // TODO: Multi tract report
    }
  };

  return (
    <div id='create-report-panel' className={className}>
      <div className={styles.createReportContainer}>
        <h4>Create Report</h4>
        {showTooManyTractsAlert ?
          <Alert type='error' slim headingLevel='h4'>
            You can only select up to {maxNumTracts} tracts for a report.
          </Alert> :
          <Alert type='info' slim headingLevel='h4'>
            Select <strong>up to {maxNumTracts}</strong> tracts in the map
          </Alert>
        }
        <p>
          <span><strong>{featureList.length} tract{featureList.length === 1 ? '' : 's'}</strong> selected</span>
        </p>
        <div id='j40-create-report-tract-list' className={styles.tractListContainer}>
          {featureList.map((item, index) => (
            <Grid row key={index}
              className={index === featureList.length - 1 ? styles.tractListItemHighlight : styles.tractListItem}>
              <Grid col="auto">
                {item.id}, {item.properties[constants.STATE_NAME]}</Grid>
              <Grid col="fill" />
              <Grid col="auto" className={styles.tractListItemDelete}>
                <Button type='button' unstyled
                  onClick={() => deleteTractHandler(item)}>
                  <img tabIndex={0} src={deleteIcon}
                    alt='Need alt message'
                  />
                </Button>
              </Grid>
            </Grid>
          ))}
        </div>
        <div className={styles.createReportButton} >
          <Button type='button' onClick={handleCreateReport}
            disabled={featureList.length == 0}>Create Report</Button>
        </div>
        <div className={styles.startOver}>
          <Button type='button' unstyled onClick={exitHandler}>Start Over</Button>
        </div>
      </div>
    </div>
  );
};

export default CreateReportPanel;
