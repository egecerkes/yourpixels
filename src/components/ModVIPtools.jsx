/*
 * ModVIPtools
 */

import React, { useState, useEffect } from 'react';
import { t } from 'ttag';

import { shardOrigin } from '../store/actions/fetch';

async function getVIPList(callback) {
  const data = new FormData();
  data.append('viplist', true);
  const resp = await fetch(`${shardOrigin}/api/modtools`, {
    credentials: 'include',
    method: 'POST',
    body: data,
  });
  if (resp.ok) {
    callback(await resp.json());
  } else {
    callback([]);
  }
}

async function addVIP(userId, callback) {
  const data = new FormData();
  data.append('addvip', userId);
  const resp = await fetch(`${shardOrigin}/api/modtools`, {
    credentials: 'include',
    method: 'POST',
    body: data,
  });
  if (resp.ok) {
    callback(true, await resp.text());
  } else {
    callback(false, await resp.text());
  }
}

async function removeVIP(userId, callback) {
  const data = new FormData();
  data.append('remvip', userId);
  const resp = await fetch(`${shardOrigin}/api/modtools`, {
    credentials: 'include',
    method: 'POST',
    body: data,
  });
  if (resp.ok) {
    callback(true, await resp.text());
  } else {
    callback(false, await resp.text());
  }
}

function ModVIPtools() {
  const [userId, setUserId] = useState('');
  const [viplist, setVIPList] = useState([]);
  const [resp, setResp] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getVIPList((vips) => setVIPList(vips));
  }, []);

  const refreshList = () => {
    getVIPList((vips) => setVIPList(vips));
  };

  return (
    <div className="content">
      {resp && (
        <div className="respbox">
          {resp.split('\n').map((line) => (
            <p key={line.slice(0, 3)}>
              {line}
            </p>
          ))}
          <span
            role="button"
            tabIndex={-1}
            className="modallink"
            onClick={() => setResp(null)}
          >
            {t`Close`}
          </span>
        </div>
      )}
      <div>
        <br />
        <h3>{t`VIP Management`}</h3>
        <p>
          {t`VIP users have 2x faster cooldown (half the normal cooldown time)`}
        </p>
        <div className="modaldivider" />
        <h3>{t`Add VIP`}</h3>
        <p>
          {t`User ID:`}
        </p>
        <input
          type="text"
          value={userId}
          placeholder="Enter User ID"
          onChange={(e) => setUserId(e.target.value.trim())}
          style={{
            width: '100%',
            maxWidth: '10em',
          }}
        />
        <br />
        <button
          type="button"
          onClick={() => {
            if (submitting || !userId) {
              return;
            }
            setSubmitting(true);
            addVIP(
              userId,
              (success, ret) => {
                setSubmitting(false);
                setResp(ret);
                if (success) {
                  setUserId('');
                  refreshList();
                }
              },
            );
          }}
        >
          {(submitting) ? '...' : t`Add VIP`}
        </button>
        <br />
        <div className="modaldivider" />
        <h3>{t`VIP List`}</h3>
        {(viplist.length) ? (
          <div>
            {viplist.map((vip) => (
              <div key={vip.id} style={{ marginBottom: '5px' }}>
                <span>
                  {vip.name}
                  {' '}
                  (
                  {vip.id}
                  )
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (submitting) {
                      return;
                    }
                    setSubmitting(true);
                    removeVIP(
                      vip.id,
                      (success, ret) => {
                        setSubmitting(false);
                        setResp(ret);
                        if (success) {
                          refreshList();
                        }
                      },
                    );
                  }}
                  style={{ marginLeft: '10px' }}
                >
                  {t`Remove`}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p>{t`No VIP users`}</p>
        )}
      </div>
    </div>
  );
}

export default React.memo(ModVIPtools);

