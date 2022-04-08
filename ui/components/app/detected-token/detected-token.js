import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import { chain } from 'lodash';

import {
  importTokens,
  ignoreTokens,
  setNewTokensImported,
} from '../../../store/actions';
import { getDetectedTokensInCurrentNetwork } from '../../../selectors';

import {
  importTokens,
  ignoreTokens,
  setNewTokensImported,
} from '../../../store/actions';
import { getDetectedTokensInCurrentNetwork } from '../../../selectors';

import { isEqualCaseInsensitive } from '../../../../shared/modules/string-utils';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import DetectedTokenSelectionPopover from './detected-token-selection-popover/detected-token-selection-popover';
import DetectedTokenIgnoredPopover from './detected-token-ignored-popover/detected-token-ignored-popover';

const DetectedToken = ({ setShowDetectedTokens }) => {
  const dispatch = useDispatch();

  const detectedTokens = useSelector(getDetectedTokensInCurrentNetwork);

  const [tokensListDetected, setTokensListDetected] = useState(() =>
    detectedTokens.reduce((tokenObj, token) => {
      tokenObj[token.address] = { token, selected: true };
      return tokenObj;
    }, {}),
  );
  const [
    showDetectedTokenIgnoredPopover,
    setShowDetectedTokenIgnoredPopover,
  ] = useState(false);

  const handleClearTokensSelection = async () => {
    // create a lodash chain on this object
    const { selected: selectedTokens, deselected: deSelectedTokens } = chain(
      tokensListDetected,
    )
      // get the values
      .values()
      // create a new object with keys 'selected', 'deselected' and group the tokens
      .groupBy((token) => (token.selected ? 'selected' : 'deselected'))
      // ditch the 'selected' property and get just the tokens'
      .mapValues((group) => group.map(({ token }) => token))
      // Exit the chain and get the underlying value, an object.
      .value();

    if (deSelectedTokens.length < detectedTokens.length) {
      await dispatch(ignoreTokens(deSelectedTokens));
      await dispatch(importTokens(selectedTokens));
      const tokenSymbols = selectedTokens.map(({ symbol }) => symbol);
      dispatch(setNewTokensImported(tokenSymbols.join(', ')));
    } else {
      await dispatch(ignoreTokens(deSelectedTokens));
    }
    setShowDetectedTokens(false);
  };

  const handleTokenSelection = (token) => {
    setTokensListDetected((prevState) => ({
      ...prevState,
      [token.address]: {
        ...prevState[token.address],
        selected: !prevState[token.address].selected,
      },
    }));
  };

  const onImport = async () => {
    // create a lodash chain on this object
    const { selected: selectedTokens } = chain(tokensListDetected)
      .values()
      .groupBy((token) => (token.selected ? 'selected' : 'deselected'))
      .mapValues((group) => group.map(({ token }) => token))
      .value();

    if (selectedTokens.length < detectedTokens.length) {
      setShowDetectedTokenIgnoredPopover(true);
    } else {
      const tokenSymbols = selectedTokens.map(({ symbol }) => symbol);
      await dispatch(importTokens(selectedTokens));
      dispatch(setNewTokensImported(tokenSymbols.join(', ')));
      setShowDetectedTokens(false);
    }
  };

  const onIgnoreAll = () => {
    const newTokensListDetected = { ...tokensListDetected };
    for (const tokenAddress of Object.keys(tokensListDetected)) {
      newTokensListDetected[tokenAddress].selected = false;
    }

    setTokensListDetected(newTokensListDetected);
    setShowDetectedTokenIgnoredPopover(true);
  };

  const onCancelIgnore = () => {
    setShowDetectedTokenIgnoredPopover(false);
  };

  return (
    <>
      {showDetectedTokenIgnoredPopover && (
        <DetectedTokenIgnoredPopover
          onCancelIgnore={onCancelIgnore}
          handleClearTokensSelection={handleClearTokensSelection}
        />
      )}
      <DetectedTokenSelectionPopover
        detectedTokens={detectedTokens}
        tokensListDetected={tokensListDetected}
        handleTokenSelection={handleTokenSelection}
        onImport={onImport}
        onIgnoreAll={onIgnoreAll}
        setShowDetectedTokens={setShowDetectedTokens}
      />
    </>
  );
};

DetectedToken.propTypes = {
  setShowDetectedTokens: PropTypes.func.isRequired,
};

export default DetectedToken;
