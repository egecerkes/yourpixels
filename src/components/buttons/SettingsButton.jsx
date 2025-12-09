/**
 *
 */

import React from 'react';
import { FaSlidersH } from 'react-icons/fa';
import { t } from 'ttag';

import useLink from '../hooks/link';


const SettingsButton = () => {
  const link = useLink();

  return (
    <div
      id="settingsbutton"
      className="actionbuttons"
      onClick={() => link('SETTINGS', { target: 'fullscreen' })}
      role="button"
      title={t`Settings`}
      tabIndex={-1}
    >
      <FaSlidersH />
    </div>
  );
};

export default React.memo(SettingsButton);
