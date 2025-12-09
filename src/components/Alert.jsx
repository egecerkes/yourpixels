/*
 *
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import GlobalCaptcha from './GlobalCaptcha';
import BanInfo from './BanInfo';
import Overlay from './Overlay';
import { closeAlert } from '../store/actions';

const Alert = () => {
  const [render, setRender] = useState(false);

  const {
    open,
    alertType,
    title,
    message,
    btn,
  } = useSelector((state) => state.alert);

  const dispatch = useDispatch();
  const close = useCallback(() => {
    dispatch(closeAlert());
  }, [dispatch]);

  // Filter out timeout messages - never show them
  const isTimeoutMessage = title && (
    title.includes('Timeout') || 
    title.includes('Zaman aşımı') ||
    title.includes('timeout') ||
    (message && (
      message.includes('yanıt alınamadı') ||
      message.includes('Didn\'t get an answer') ||
      message.includes('refresh')
    ))
  );

  // If it's a timeout message, don't show it
  if (isTimeoutMessage && open) {
    dispatch(closeAlert());
    return null;
  }

  useEffect(() => {
    if (open) {
      window.setTimeout(() => {
        setRender(true);
      }, 10);
    }
  }, [open]);

  let Content = null;
  switch (alertType) {
    case 'captcha':
      Content = GlobalCaptcha;
      break;
    case 'ban':
      Content = BanInfo;
      break;
    default:
      // nothing
  }

  if (!render && !open) {
    return null;
  }

  const show = open && render;

  return (
    <>
      <Overlay
        z={6}
        show={show}
        onClick={close}
      />
      <div
        className={(show) ? 'Alert show' : 'Alert'}
        onTransitionEnd={() => {
          if (!open) setRender(false);
        }}
      >
        <h2>{title}</h2>
        {(message) && (
        <p>
          {message}
        </p>
        )}
        {(Content) ? (
          <Content close={close} />
        ) : (
          <button
            type="button"
            onClick={close}
          >{btn}</button>
        )}
      </div>
      )
    </>
  );
};

export default React.memo(Alert);
