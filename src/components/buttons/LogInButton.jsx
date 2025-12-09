/**
 *
 */

import React from 'react';
import { FaUserCircle } from 'react-icons/fa';
import { t } from 'ttag';

import useLink from '../hooks/link';

const LogInButton = () => {
  const link = useLink();

  return (
    <div
      id="loginbutton"
      className="actionbuttons"
      onClick={() => link('USERAREA', { target: 'fullscreen' })}
      role="button"
      title={t`User Area`}
      tabIndex={-1}
    >
      <FaUserCircle />
    </div>
  );
};

export default React.memo(LogInButton);
