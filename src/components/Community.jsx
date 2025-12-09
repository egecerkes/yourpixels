/*
 * Community Component
 */

import React, { useState, useEffect } from 'react';
import { t } from 'ttag';

import { shardOrigin } from '../store/actions/fetch';

async function getCommunityList(callback) {
  try {
    const resp = await fetch(`${shardOrigin}/api/community/list`, {
      credentials: 'include',
    });
    if (resp.ok) {
      callback(await resp.json());
    } else {
      callback([]);
    }
  } catch {
    callback([]);
  }
}

async function getMyCommunities(callback) {
  try {
    const resp = await fetch(`${shardOrigin}/api/community/my`, {
      credentials: 'include',
    });
    if (resp.ok) {
      callback(await resp.json());
    } else {
      callback([]);
    }
  } catch {
    callback([]);
  }
}

async function createCommunity(name, description, callback) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const resp = await fetch(`${shardOrigin}/api/community/create`, {
      credentials: 'include',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, description }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (resp.ok) {
      callback(true, await resp.json());
    } else {
      const errorText = await resp.text();
      callback(false, errorText || 'Failed to create community');
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      callback(false, 'Request timeout. Please try again.');
    } else {
      callback(false, err.message || 'Network error occurred');
    }
  }
}

async function joinCommunity(communityId, callback) {
  try {
    const resp = await fetch(`${shardOrigin}/api/community/join`, {
      credentials: 'include',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ communityId }),
    });
    if (resp.ok) {
      callback(true, await resp.text());
    } else {
      callback(false, await resp.text());
    }
  } catch (err) {
    callback(false, err.message);
  }
}

async function leaveCommunity(communityId, callback) {
  try {
    const resp = await fetch(`${shardOrigin}/api/community/leave`, {
      credentials: 'include',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ communityId }),
    });
    if (resp.ok) {
      callback(true, await resp.text());
    } else {
      callback(false, await resp.text());
    }
  } catch (err) {
    callback(false, err.message);
  }
}

async function getMembers(communityId, callback) {
  try {
    const resp = await fetch(`${shardOrigin}/api/community/${communityId}/members`, {
      credentials: 'include',
    });
    if (resp.ok) {
      callback(await resp.json());
    } else {
      callback([]);
    }
  } catch {
    callback([]);
  }
}

async function getRoles(communityId, callback) {
  try {
    const resp = await fetch(`${shardOrigin}/api/community/${communityId}/roles`, {
      credentials: 'include',
    });
    if (resp.ok) {
      callback(await resp.json());
    } else {
      callback([]);
    }
  } catch {
    callback([]);
  }
}

async function createRole(communityId, name, permissions, callback) {
  try {
    const resp = await fetch(`${shardOrigin}/api/community/${communityId}/role/create`, {
      credentials: 'include',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, permissions }),
    });
    if (resp.ok) {
      callback(true, await resp.json());
    } else {
      callback(false, await resp.text());
    }
  } catch (err) {
    callback(false, err.message);
  }
}

async function assignRole(communityId, userId, roleId, callback) {
  try {
    const resp = await fetch(`${shardOrigin}/api/community/${communityId}/role/assign`, {
      credentials: 'include',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, roleId }),
    });
    if (resp.ok) {
      callback(true, await resp.text());
    } else {
      callback(false, await resp.text());
    }
  } catch (err) {
    callback(false, err.message);
  }
}

async function getChannels(communityId, callback) {
  try {
    const resp = await fetch(`${shardOrigin}/api/community/${communityId}/channels`, {
      credentials: 'include',
    });
    if (resp.ok) {
      callback(await resp.json());
    } else {
      callback([]);
    }
  } catch {
    callback([]);
  }
}

async function createChannel(communityId, name, callback) {
  try {
    const resp = await fetch(`${shardOrigin}/api/community/${communityId}/channels/create`, {
      credentials: 'include',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    });
    if (resp.ok) {
      callback(true, await resp.json());
    } else {
      callback(false, await resp.text());
    }
  } catch (err) {
    callback(false, err.message);
  }
}

async function deleteChannel(communityId, channelId, callback) {
  try {
    const resp = await fetch(`${shardOrigin}/api/community/${communityId}/channels/${channelId}/delete`, {
      credentials: 'include',
      method: 'POST',
    });
    if (resp.ok) {
      callback(true, await resp.text());
    } else {
      callback(false, await resp.text());
    }
  } catch (err) {
    callback(false, err.message);
  }
}

async function editChannel(communityId, channelId, name, callback) {
  try {
    const resp = await fetch(`${shardOrigin}/api/community/${communityId}/channels/${channelId}/edit`, {
      credentials: 'include',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    });
    if (resp.ok) {
      callback(true, await resp.text());
    } else {
      callback(false, await resp.text());
    }
  } catch (err) {
    callback(false, err.message);
  }
}

function Community() {
  const [view, setView] = useState('list'); // 'list', 'my', 'create', 'manage'
  const [communityList, setCommunityList] = useState([]);
  const [myCommunities, setMyCommunities] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [members, setMembers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [channels, setChannels] = useState([]);
  const [resp, setResp] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [roleName, setRoleName] = useState('');
  const [rolePermissions, setRolePermissions] = useState(0);
  const [channelName, setChannelName] = useState('');
  const [editingChannelId, setEditingChannelId] = useState(null);
  const [editingChannelName, setEditingChannelName] = useState('');

  useEffect(() => {
    if (view === 'list') {
      getCommunityList(setCommunityList);
    } else if (view === 'my') {
      getMyCommunities(setMyCommunities);
    }
  }, [view]);

  useEffect(() => {
    if (selectedCommunity) {
      getMembers(selectedCommunity.id, setMembers);
      getRoles(selectedCommunity.id, setRoles);
      getChannels(selectedCommunity.id, setChannels);
    }
  }, [selectedCommunity]);

  const handleCreateCommunity = () => {
    if (submitting || !createName.trim()) return;
    setSubmitting(true);
    createCommunity(createName.trim(), createDesc.trim(), (success, result) => {
      setSubmitting(false);
      if (success) {
        setResp(t`Community created successfully!`);
        setCreateName('');
        setCreateDesc('');
        setView('my');
        getMyCommunities(setMyCommunities);
      } else {
        setResp(result);
      }
    });
  };

  const handleJoin = (communityId) => {
    if (submitting) return;
    setSubmitting(true);
    joinCommunity(communityId, (success, result) => {
      setSubmitting(false);
      setResp(result);
      if (success) {
        getMyCommunities(setMyCommunities);
        getCommunityList(setCommunityList);
      }
    });
  };

  const handleLeave = (communityId) => {
    if (submitting) return;
    setSubmitting(true);
    leaveCommunity(communityId, (success, result) => {
      setSubmitting(false);
      setResp(result);
      if (success) {
        getMyCommunities(setMyCommunities);
        getCommunityList(setCommunityList);
        if (selectedCommunity && selectedCommunity.id === communityId) {
          setSelectedCommunity(null);
          setView('my');
        }
      }
    });
  };

  const handleCreateRole = () => {
    if (submitting || !roleName.trim() || !selectedCommunity) return;
    setSubmitting(true);
    createRole(selectedCommunity.id, roleName.trim(), rolePermissions, (success, result) => {
      setSubmitting(false);
      if (success) {
        setResp(t`Role created successfully!`);
        setRoleName('');
        setRolePermissions(0);
        getRoles(selectedCommunity.id, setRoles);
      } else {
        setResp(result);
      }
    });
  };

  const handleAssignRole = (userId, roleId) => {
    if (submitting || !selectedCommunity) return;
    setSubmitting(true);
    assignRole(selectedCommunity.id, userId, roleId, (success, result) => {
      setSubmitting(false);
      setResp(result);
      if (success) {
        getMembers(selectedCommunity.id, setMembers);
      }
    });
  };

  const handleCreateChannel = () => {
    if (submitting || !channelName.trim() || !selectedCommunity) return;
    setSubmitting(true);
    createChannel(selectedCommunity.id, channelName.trim(), (success, result) => {
      setSubmitting(false);
      if (success) {
        setResp(t`Channel created successfully!`);
        setChannelName('');
        getChannels(selectedCommunity.id, setChannels);
      } else {
        setResp(result);
      }
    });
  };

  const handleDeleteChannel = (channelId) => {
    if (submitting || !selectedCommunity) return;
    if (!window.confirm(t`Are you sure you want to delete this channel?`)) return;
    setSubmitting(true);
    deleteChannel(selectedCommunity.id, channelId, (success, result) => {
      setSubmitting(false);
      setResp(result);
      if (success) {
        getChannels(selectedCommunity.id, setChannels);
      }
    });
  };

  const handleEditChannel = (channelId) => {
    if (submitting || !selectedCommunity) return;
    setSubmitting(true);
    editChannel(selectedCommunity.id, channelId, editingChannelName.trim(), (success, result) => {
      setSubmitting(false);
      setResp(result);
      if (success) {
        setEditingChannelId(null);
        setEditingChannelName('');
        getChannels(selectedCommunity.id, setChannels);
      }
    });
  };

  const formatPixels = (pixels) => {
    if (pixels >= 1000000) {
      return `${(pixels / 1000000).toFixed(2)}M`;
    }
    if (pixels >= 1000) {
      return `${(pixels / 1000).toFixed(2)}K`;
    }
    return pixels.toString();
  };

  return (
    <div className="content">
      {resp && (
        <div className="respbox">
          {(typeof resp === 'string' ? resp.split('\n') : [resp]).map((line, idx) => (
            <p key={idx}>{line}</p>
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

      <div style={{ marginBottom: '10px' }}>
        <span
          role="button"
          tabIndex={-1}
          className={view === 'list' ? 'modallink selected' : 'modallink'}
          onClick={() => setView('list')}
        >
          {t`All Communities`}
        </span>
        <span className="hdivider" />
        <span
          role="button"
          tabIndex={-1}
          className={view === 'my' ? 'modallink selected' : 'modallink'}
          onClick={() => setView('my')}
        >
          {t`My Communities`}
        </span>
        <span className="hdivider" />
        <span
          role="button"
          tabIndex={-1}
          className={view === 'create' ? 'modallink selected' : 'modallink'}
          onClick={() => setView('create')}
        >
          {t`Create Community`}
        </span>
      </div>

      <div className="modaldivider" />

      {view === 'list' && (
        <div>
          <h3>{t`All Communities`}</h3>
          {communityList && communityList.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {communityList.map((comm) => (
                <li key={comm.id} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ccc' }}>
                  <strong>{comm.name}</strong>
                  {comm.description && <div style={{ fontSize: '0.9em', color: '#666' }}>{comm.description}</div>}
                  <div style={{ fontSize: '0.9em', marginTop: '5px' }}>
                    {t`Total Pixels`}: {formatPixels(comm.totalPixels)} | {t`Creator`}: {comm.creatorName || `ID: ${comm.creatorId}`}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleJoin(comm.id)}
                    disabled={submitting}
                    style={{ marginTop: '5px' }}
                  >
                    {t`Join`}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>{t`No communities found.`}</p>
          )}
        </div>
      )}

      {view === 'my' && (
        <div>
          <h3>{t`My Communities`}</h3>
          {myCommunities && myCommunities.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {myCommunities.map((comm) => (
                <li key={comm.id} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ccc' }}>
                  <strong>{comm.name}</strong>
                  {comm.description && <div style={{ fontSize: '0.9em', color: '#666' }}>{comm.description}</div>}
                  <div style={{ fontSize: '0.9em', marginTop: '5px' }}>
                    {t`Total Pixels`}: {formatPixels(comm.totalPixels)}
                    {comm.roleName && ` | ${t`Role`}: ${comm.roleName}`}
                    {comm.isCreator && ` | ${t`Creator`}`}
                  </div>
                  <div style={{ marginTop: '5px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCommunity(comm);
                        setView('manage');
                      }}
                      style={{ marginRight: '5px' }}
                    >
                      {t`Manage`}
                    </button>
                    {!comm.isCreator && (
                      <button
                        type="button"
                        onClick={() => handleLeave(comm.id)}
                        disabled={submitting}
                      >
                        {t`Leave`}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>{t`You are not a member of any community.`}</p>
          )}
        </div>
      )}

      {view === 'create' && (
        <div>
          <h3>{t`Create Community`}</h3>
          <p>{t`Community Name`} (max 64 characters)</p>
          <input
            maxLength={64}
            style={{ width: '100%' }}
            value={createName}
            placeholder={t`Enter Community Name`}
            onChange={(evt) => setCreateName(evt.target.value)}
          />
          <p>{t`Description`} (optional)</p>
          <textarea
            style={{ width: '100%', minHeight: '100px' }}
            value={createDesc}
            placeholder={t`Enter Description`}
            onChange={(evt) => setCreateDesc(evt.target.value)}
          />
          <button
            type="button"
            onClick={handleCreateCommunity}
            disabled={submitting || !createName.trim()}
          >
            {submitting ? '...' : t`Create Community`}
          </button>
        </div>
      )}

      {view === 'manage' && selectedCommunity && (
        <div>
          <h3>{t`Manage`}: {selectedCommunity.name}</h3>
          <p>{t`Total Pixels`}: {formatPixels(selectedCommunity.totalPixels)}</p>

          <div className="modaldivider" />

          <h4>{t`Members`}</h4>
          {members && members.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {members.map((member) => (
                <li key={member.userId} style={{ marginBottom: '5px', padding: '5px' }}>
                  {member.userName} (ID: {member.userId}) - {formatPixels(member.totalPixels)} {t`pixels`}
                  {member.isCreator && ` [${t`Creator`}]`}
                  {!member.isCreator && selectedCommunity.isCreator && (
                    <div style={{ marginTop: '5px' }}>
                      <select
                        value={member.roleId || ''}
                        onChange={(evt) => handleAssignRole(member.userId, evt.target.value || null)}
                        disabled={submitting}
                      >
                        <option value="">{t`No Role`}</option>
                        {roles && roles.map((role) => (
                          <option key={role.id} value={role.id}>{role.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p>{t`No members found.`}</p>
          )}

          <div className="modaldivider" />

          <h4>{t`Roles`}</h4>
          {selectedCommunity.isCreator && (
            <div style={{ marginBottom: '10px' }}>
              <input
                maxLength={32}
                style={{ width: '200px', marginRight: '5px' }}
                value={roleName}
                placeholder={t`Role Name`}
                onChange={(evt) => setRoleName(evt.target.value)}
              />
              <label>
                <input
                  type="checkbox"
                  checked={(rolePermissions & 1) !== 0}
                  onChange={(evt) => setRolePermissions(evt.target.checked ? rolePermissions | 1 : rolePermissions & ~1)}
                />
                {t`Manage Roles`}
              </label>
              <label style={{ marginLeft: '10px' }}>
                <input
                  type="checkbox"
                  checked={(rolePermissions & 2) !== 0}
                  onChange={(evt) => setRolePermissions(evt.target.checked ? rolePermissions | 2 : rolePermissions & ~2)}
                />
                {t`Manage Members`}
              </label>
              <label style={{ marginLeft: '10px' }}>
                <input
                  type="checkbox"
                  checked={(rolePermissions & 4) !== 0}
                  onChange={(evt) => setRolePermissions(evt.target.checked ? rolePermissions | 4 : rolePermissions & ~4)}
                />
                {t`Kick Members`}
              </label>
              <label style={{ marginLeft: '10px' }}>
                <input
                  type="checkbox"
                  checked={(rolePermissions & 8) !== 0}
                  onChange={(evt) => setRolePermissions(evt.target.checked ? rolePermissions | 8 : rolePermissions & ~8)}
                />
                {t`Edit Community`}
              </label>
              <label style={{ marginLeft: '10px' }}>
                <input
                  type="checkbox"
                  checked={(rolePermissions & 16) !== 0}
                  onChange={(evt) => setRolePermissions(evt.target.checked ? rolePermissions | 16 : rolePermissions & ~16)}
                />
                {t`Manage Channels`}
              </label>
              <button
                type="button"
                onClick={handleCreateRole}
                disabled={submitting || !roleName.trim()}
                style={{ marginLeft: '10px' }}
              >
                {submitting ? '...' : t`Create Role`}
              </button>
            </div>
          )}
          {roles && roles.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {roles.map((role) => (
                <li key={role.id} style={{ marginBottom: '5px', padding: '5px' }}>
                  <strong>{role.name}</strong>
                  <div style={{ fontSize: '0.9em', color: '#666' }}>
                    {t`Permissions`}: {(role.permissions & 1) ? t`Manage Roles ` : ''}
                    {(role.permissions & 2) ? t`Manage Members ` : ''}
                    {(role.permissions & 4) ? t`Kick Members ` : ''}
                    {(role.permissions & 8) ? t`Edit Community ` : ''}
                    {(role.permissions & 16) ? t`Manage Channels ` : ''}
                    {!role.permissions && t`None`}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>{t`No roles found.`}</p>
          )}

          <div className="modaldivider" />

          <h4>{t`Chat Channels`}</h4>
          {selectedCommunity.isCreator && (
            <div style={{ marginBottom: '10px' }}>
              <input
                maxLength={32}
                style={{ width: '200px', marginRight: '5px' }}
                value={channelName}
                placeholder={t`Channel Name`}
                onChange={(evt) => setChannelName(evt.target.value)}
              />
              <button
                type="button"
                onClick={handleCreateChannel}
                disabled={submitting || !channelName.trim()}
              >
                {submitting ? '...' : t`Create Channel`}
              </button>
            </div>
          )}
          {channels && channels.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {channels.map((channel) => (
                <li key={channel.id} style={{ marginBottom: '5px', padding: '5px', border: '1px solid #eee' }}>
                  {editingChannelId === channel.id ? (
                    <div>
                      <input
                        maxLength={32}
                        style={{ width: '200px', marginRight: '5px' }}
                        value={editingChannelName}
                        onChange={(evt) => setEditingChannelName(evt.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => handleEditChannel(channel.id)}
                        disabled={submitting || !editingChannelName.trim()}
                        style={{ marginRight: '5px' }}
                      >
                        {submitting ? '...' : t`Save`}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingChannelId(null);
                          setEditingChannelName('');
                        }}
                        disabled={submitting}
                      >
                        {t`Cancel`}
                      </button>
                    </div>
                  ) : (
                    <div>
                      <strong>{channel.name}</strong>
                      {selectedCommunity.isCreator && (
                        <div style={{ marginTop: '5px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingChannelId(channel.id);
                              setEditingChannelName(channel.name);
                            }}
                            disabled={submitting}
                            style={{ marginRight: '5px' }}
                          >
                            {t`Edit`}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteChannel(channel.id)}
                            disabled={submitting}
                          >
                            {t`Delete`}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p>{t`No channels found.`}</p>
          )}

          <div className="modaldivider" />
          <button
            type="button"
            onClick={() => {
              setSelectedCommunity(null);
              setView('my');
            }}
          >
            {t`Back`}
          </button>
        </div>
      )}
    </div>
  );
}

export default React.memo(Community);

