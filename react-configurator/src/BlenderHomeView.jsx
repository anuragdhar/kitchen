import React from 'react';
import ArchivedBlenderHomeView from './ArchivedBlenderHomeView.jsx';
import CurrentRoomBlenderView from './home/CurrentRoomBlenderView.jsx';
import {usesEditableRoomSource} from './render/roomParity.mjs';

// Retain historical whole-home and unaffected-room previews unchanged. The
// affected rooms require their full, audited editable snapshot without clipping.
export default function BlenderHomeView({room=null}){
  return usesEditableRoomSource(room?.key)
    ? <CurrentRoomBlenderView room={room}/>
    : <ArchivedBlenderHomeView room={room}/>;
}
