import axios from 'axios';
import { config } from '../config.js';

const adminClient = axios.create({
  baseURL: config.jellyfinBaseUrl,
  headers: {
    'Content-Type': 'application/json',
    'X-Emby-Token': config.jellyfinApiToken
  }
});

export async function createJellyfinUser(name, password) {
  const response = await adminClient.post('/Users/New', {
    Name: name,
    Password: password
  });
  return response.data;
}

export async function setUserPolicy(userId, tier) {
  const enableDownloads = tier === 'premium';
  const response = await adminClient.post(`/Users/${userId}/Policy`, {
    IsAdministrator: false,
    IsHidden: false,
    IsDisabled: false,
    EnableContentDeletion: false,
    EnableDownloads: enableDownloads,
    EnableAllDevices: true,
    EnableRemoteControlOfOtherUsers: false,
    EnableSharedDeviceControl: false,
    EnableRemoteAccess: true,
    EnableMediaPlayback: true
  });
  return response.data;
}

export async function disableUser(userId) {
  const response = await adminClient.post(`/Users/${userId}/Policy`, {
    IsAdministrator: false,
    IsHidden: false,
    IsDisabled: true,
    EnableContentDeletion: false,
    EnableDownloads: false,
    EnableAllDevices: true,
    EnableRemoteControlOfOtherUsers: false,
    EnableSharedDeviceControl: false,
    EnableRemoteAccess: false,
    EnableMediaPlayback: false
  });
  return response.data;
}

export async function authenticateJellyfinUser(username, password) {
  const response = await axios.post(`${config.jellyfinBaseUrl}/Users/AuthenticateByName`, {
    Username: username,
    Pw: password
  }, {
    headers: { 'Content-Type': 'application/json' }
  });
  return response.data;
}

export async function fetchLibraryItems(accessToken, parentId) {
  const params = parentId ? { ParentId: parentId } : { IncludeItemTypes: 'Series,Movie' };
  const response = await axios.get(`${config.jellyfinBaseUrl}/Items`, {
    params,
    headers: {
      'X-Emby-Token': accessToken
    }
  });
  return response.data;
}
