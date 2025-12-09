/*
 *
 */

import React from 'react';
import { useSelector } from 'react-redux';

function Style() {
  let style = useSelector((state) => state.gui.style);
  const buttonNeonEnabled = useSelector((state) => state.gui.buttonNeonEnabled);
  const buttonNeonColor = useSelector((state) => state.gui.buttonNeonColor);
  
  if (!window.ssv.availableStyles) {
    return null;
  }

  // style for special occasions
  const curDate = new Date();
  const month = curDate.getMonth() + 1;
  const day = curDate.getDate();
  if ((day === 31 && month === 10) || (day === 1 && month === 11)) {
    // halloween
    style = 'dark-spooky';
  }

  const cssUri = window.ssv.availableStyles[style];

  // Dynamic button neon styles
  const neonStyle = buttonNeonEnabled ? {
    '--neon-color': buttonNeonColor,
  } : {};

  return (
    <>
      {(style === 'default' || !cssUri) ? null
        : (<link rel="stylesheet" type="text/css" href={cssUri} />)}
      <style>
        {buttonNeonEnabled ? `
          .actionbuttons {
            border: 2px solid var(--neon-color, ${buttonNeonColor}) !important;
            box-shadow: 0 0 15px var(--neon-color, ${buttonNeonColor}) !important;
            color: var(--neon-color, ${buttonNeonColor}) !important;
            text-shadow: 0 0 10px var(--neon-color, ${buttonNeonColor}) !important;
          }
          .actionbuttons:hover {
            box-shadow: 0 0 30px var(--neon-color, ${buttonNeonColor}) !important;
            text-shadow: 0 0 20px var(--neon-color, ${buttonNeonColor}) !important;
          }
        ` : `
          .actionbuttons {
            border: 2px solid #00ff41 !important;
            box-shadow: none !important;
            color: #00ff41 !important;
            text-shadow: none !important;
          }
          .actionbuttons:hover {
            box-shadow: none !important;
            text-shadow: none !important;
          }
        `}
      </style>
    </>
  );
}

export default React.memo(Style);
