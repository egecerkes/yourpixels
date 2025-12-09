/*
 * Admintools
 */

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { t } from 'ttag';

import { shardOrigin } from '../store/actions/fetch';
import { setDrawingMode } from '../store/actions';

async function submitIPAction(
  action,
  vallist,
  callback,
) {
  const data = new FormData();
  data.append('ipaction', action);
  data.append('ip', vallist);
  const resp = await fetch(`${shardOrigin}/api/modtools`, {
    credentials: 'include',
    method: 'POST',
    body: data,
  });
  callback(await resp.text());
}

async function getModList(
  callback,
) {
  const data = new FormData();
  data.append('modlist', true);
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

async function submitRemMod(
  userId,
  callback,
) {
  const data = new FormData();
  data.append('remmod', userId);
  const resp = await fetch(`${shardOrigin}/api/modtools`, {
    credentials: 'include',
    method: 'POST',
    body: data,
  });
  callback(resp.ok, await resp.text());
}

async function submitMakeMod(
  userName,
  callback,
) {
  const data = new FormData();
  data.append('makemod', userName);
  const resp = await fetch(`${shardOrigin}/api/modtools`, {
    credentials: 'include',
    method: 'POST',
    body: data,
  });
  if (resp.ok) {
    callback(await resp.json());
  } else {
    callback(await resp.text());
  }
}

async function getAdminCooldownStatus(callback) {
  const data = new FormData();
  data.append('getadmincooldown', true);
  const resp = await fetch(`${shardOrigin}/api/modtools`, {
    credentials: 'include',
    method: 'POST',
    body: data,
  });
  if (resp.ok) {
    const result = await resp.json();
    callback(result.enabled);
  } else {
    callback(true); // default: cooldown enabled
  }
}

async function setAdminCooldownStatus(enabled, callback) {
  const data = new FormData();
  data.append('setadmincooldown', enabled);
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


function Admintools() {
  const dispatch = useDispatch();
  const [iPAction, selectIPAction] = useState('iidtoip');
  const [modName, selectModName] = useState('');
  const [txtval, setTxtval] = useState('');
  const [resp, setResp] = useState(null);
  const [modlist, setModList] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [adminCooldownEnabled, setAdminCooldownEnabled] = useState(true);
  
  const drawingMode = useSelector((state) => state.gui.drawingMode);

  useEffect(() => {
    getModList((mods) => setModList(mods));
    getAdminCooldownStatus((enabled) => setAdminCooldownEnabled(enabled));
  }, []);

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
        <h3>{t`IP Actions`}</h3>
        <p>
          {t`Do stuff with IPs (one IP per line)`}
        </p>
        <select
          value={iPAction}
          onChange={(e) => {
            const sel = e.target;
            selectIPAction(sel.options[sel.selectedIndex].value);
          }}
        >
          {['iidtoip', 'iptoiid', 'clearratelimit']
            .map((opt) => (
              <option
                key={opt}
                value={opt}
              >
                {opt}
              </option>
            ))}
        </select>
        <br />
        <textarea
          rows="10"
          cols="17"
          value={txtval}
          onChange={(e) => setTxtval(e.target.value)}
        /><br />
        <button
          type="button"
          onClick={() => {
            if (submitting) {
              return;
            }
            setSubmitting(true);
            submitIPAction(
              iPAction,
              txtval,
              (ret) => {
                setSubmitting(false);
                setTxtval(ret);
              },
            );
          }}
        >
          {(submitting) ? '...' : t`Submit`}
        </button>
        <br />
        <div className="modaldivider" />
        <h3>{t`Manage Moderators`}</h3>
        <p>
          {t`Remove Moderator`}
        </p>
        {(modlist.length) ? (
          <span
            className="unblocklist"
          >
            {modlist.map((mod) => (
              <div
                role="button"
                tabIndex={0}
                key={mod[0]}
                onClick={() => {
                  if (submitting) {
                    return;
                  }
                  setSubmitting(true);
                  submitRemMod(mod[0], (success, ret) => {
                    if (success) {
                      setModList(
                        modlist.filter((modl) => (modl[0] !== mod[0])),
                      );
                    }
                    setSubmitting(false);
                    setResp(ret);
                  });
                }}
              >
                {`⦸ ${mod[0]} ${mod[1]}`}
              </div>
            ))}
          </span>
        )
          : (
            <p>{t`There are no mods`}</p>
          )}
        <br />

        <p>
          {t`Assign new Mod`}
        </p>
        <p>
          {t`Enter UserName of new Mod`}:&nbsp;
          <input
            value={modName}
            style={{
              display: 'inline-block',
              width: '100%',
              maxWidth: '20em',
            }}
            type="text"
            placeholder={t`User Name`}
            onChange={(evt) => {
              const co = evt.target.value.trim();
              selectModName(co);
            }}
          />
        </p>
        <button
          type="button"
          onClick={() => {
            if (submitting) {
              return;
            }
            setSubmitting(true);
            submitMakeMod(
              modName,
              (ret) => {
                if (typeof ret === 'string') {
                  setResp(ret);
                } else {
                  setResp(`Made ${ret[1]} mod successfully.`);
                  setModList([...modlist, ret]);
                }
                setSubmitting(false);
              },
            );
          }}
        >
          {(submitting) ? '...' : t`Submit`}
        </button>
        <br />
        <div className="modaldivider" />
        <h3>{t`Admin Cooldown`}</h3>
        <p>
          {t`Cooldown Setting`}:
        </p>
        <select
          value={adminCooldownEnabled ? 'cooldown' : 'nocooldown'}
          onChange={(e) => {
            const enabled = e.target.value === 'cooldown';
            if (submitting) {
              return;
            }
            setSubmitting(true);
            setAdminCooldownStatus(enabled, (success, result) => {
              setSubmitting(false);
              if (success) {
                setAdminCooldownEnabled(enabled);
                setResp(result);
              } else {
                setResp(result);
              }
            });
          }}
          disabled={submitting}
        >
          <option value="cooldown">{t`Cooldown`}</option>
          <option value="nocooldown">{t`No Cooldown`}</option>
        </select>
        <p style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>
          {adminCooldownEnabled
            ? t`Pixels will be counted in stats and you will have cooldown`
            : t`Pixels will NOT be counted in stats and you will have no cooldown`}
        </p>
        <br />
        <div className="modaldivider" />
        <h3>{t`Drawing Tools`}</h3>
        <p>
          {t`Select Drawing Tool`}:
        </p>
        <select
          value={drawingMode}
          onChange={(e) => {
            dispatch(setDrawingMode(e.target.value));
          }}
        >
          <option value="normal">{t`Normal`}</option>
          <option value="brush">{t`Brush`}</option>
          <option value="line">{t`Line`}</option>
          <option value="fill">{t`Fill`}</option>
        </select>
        {drawingMode === 'brush' && (
          <p style={{ fontSize: '0.9em', color: '#666', marginTop: '10px' }}>
            {t`Brush tool has no cooldown. Click and drag to paint.`}
          </p>
        )}
        {(drawingMode === 'line' || drawingMode === 'fill') && (
          <p style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>
            {drawingMode === 'line' 
              ? t`Line tool: Click two points to draw a line. No cooldown.`
              : t`Fill tool: Click to fill an area. No cooldown.`}
          </p>
        )}
        <br />
        <div className="modaldivider" />
        <h3>{t`Tile Management`}</h3>
        <p>
          {t`Regenerate all tiles for all canvases. This fixes zoom issues where zoomed out view shows nothing.`}
        </p>
        <p style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>
          {t`Warning: This process may take a long time. Tiles will be regenerated in the background.`}
        </p>
        <button
          type="button"
          onClick={() => {
            if (submitting) {
              return;
            }
            if (!window.confirm(t`Are you sure you want to regenerate all tiles? This may take a long time.`)) {
              return;
            }
            setSubmitting(true);
            const data = new FormData();
            data.append('regeneratetiles', true);
            fetch(`${shardOrigin}/api/modtools`, {
              credentials: 'include',
              method: 'POST',
              body: data,
            })
              .then((resp) => resp.text())
              .then((ret) => {
                setSubmitting(false);
                setResp(ret);
              })
              .catch((err) => {
                setSubmitting(false);
                setResp(`Error: ${err.message}`);
              });
          }}
          disabled={submitting}
        >
          {submitting ? '...' : t`Regenerate All Tiles`}
        </button>
        <br />
        <div className="modaldivider" />
        <br />
      </div>
    </div>
  );
}

export default React.memo(Admintools);
