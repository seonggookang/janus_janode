/* eslint-disable no-sparse-arrays */
/* global io */

'use strict';

const RTCPeerConnection = (window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection).bind(window);

const pcMap = new Map();
let pendingOfferMap = new Map();
var myRoom = getURLParameter('room') ? parseInt(getURLParameter('room')) : (getURLParameter('room_str') || 12345555555);
const randName = ('John_Doe_' + Math.floor(10000 * Math.random()));
const myName = getURLParameter('name') || randName;

const button = document.getElementById('button');
var localStream;

connect.onclick = () => {
  if (socket.connected) {
    alert('already connected!');
  }
  else {
    socket.connect();
  }
};

disconnect.onclick = () => {
  if (!socket.connected) {
    alert('already disconnected!');
  }
  else {
    socket.disconnect();
  }
};

create_room.onclick = () => {
  if ($('#new_room_name').val() == '') alert('생성할 방이름을 입력해야 합니다.');
  else _create({ 
    room: generateRandomNumber(), 
    description: $('#new_room_name').val(), 
    max_publishers : 100, 
    audiocodec : 'opus', 
    videocodec : 'vp8', 
    talking_events : false, 
    talking_level_threshold : 25, 
    talking_packets_threshold : 100, 
    permanent : true, // false -> true로 바꾸니 서버에 아예 영구히 들어감 - by steve
    bitrate: 128000,
    secret: 'adminpwd'
  });
};

function _create({ room, description, max_publishers = 6, audiocodec = 'opus', videocodec = 'vp8', talking_events = false, talking_level_threshold = 25, talking_packets_threshold = 100, permanent = false, bitrate = 128000 }) {
  socket.emit('create', {
    data: {
      room,
      description,
      max_publishers,
      audiocodec,
      videocodec,
      talking_events,
      talking_level_threshold,
      talking_packets_threshold,
      permanent,
      bitrate,
      secret: 'adminpwd',
    },
    _id: getId(),
  });
}

list_rooms.onclick = () => {
  _listRooms();
};

// join2.onclick = () => {
//   alert('join');
//   join();
// };

leave_all.onclick = () => {
  let evtdata = {
    data: {feed: $('#local_feed').text()},
  }
  console.log(evtdata);
  if ($('#local_feed').text() == '') return;
  else _leaveAll({feed: $('#local_feed').text()});
};

unpublish.onclick = () => {
  if ($('#unpublish').text() == 'Unpublish') {
    console.log('local_feed >>> ', local_feed);
    if (local_feed) {
      _unpublish({feed : local_feed});
    }
  } else {
    publishOwnFeed();
  }
};

function getId() {
  return Math.floor(Number.MAX_SAFE_INTEGER * Math.random());
}
function generateRandomNumber() {
  const randomNumber = Math.floor(Math.random() * 1e16).toString().padStart(16, '0');
  return parseInt(randomNumber);
}
function getURLParameter(name) {
  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [, ''])[1].replace(/\+/g, '%20')) || null;
}

const scheduleConnection = (function () {
  let task = null;
  const delay = 5000;

  return (function (secs) {
    if (task) return;
    const timeout = secs * 1000 || delay;
    console.log('scheduled joining in ' + timeout + ' ms');
    task = setTimeout(() => {
      join();
      task = null;
    }, timeout);
  });
})();

const scheduleConnection2 = (function (room) {
  console.log('room==='+room); // 이것만 계속 나오네
  let task = null;
  const delay = 5000;

  return (function (secs) {
    if (task) return;
    myRoom = room;
    const timeout = secs * 1000 || delay;
    console.log('scheduled joining222 in ' + timeout + ' ms');
    task = setTimeout(() => {
      join();
      task = null;
    }, timeout);
  });
})();

// const socket = io('https://192.168.50.156:4443/'); // 
// const socket = io('https://192.168.50.19:4443/'); // 
// const socket = io('https://192.168.50.116:4443/'); // 
// const socket = io('https://192.168.56.1:4443/'); // 
// const socket = io("https://localhost:4443"); // 내 주소
const socket = io({
  rejectUnauthorized: false,
  autoConnect: false,
  reconnection: false,
});

function destroy_room(room, desc) {
    if (confirm(desc + ' room을 삭제하겠습니까?')) {
      _destroy({ room : room, permanent : true, secret : 'adminpwd' }); // permanent를 true로 설정해서 영구히 삭제 - by Steve
    }
};

// function join22(room, desc, participant) {
//   console.log('participant >>> ', participant);
//   var display_name = $('#display_name').val();
//   if (display_name == '') {
//     alert('참석할 이름을 입력해야 합니다.');
//     return;
//   }
//   console.log('room >>> ', room);
  
//   let videosElement = document.getElementById('videos');
//   console.log('videosElement >>> ', videosElement);
//   setTimeout(() => {
//     let firstSpan = videosElement.querySelector('span');
//     console.log('firstSpan >>> ', firstSpan);
    
//     setTimeout(() => {
//       let innerHTML = firstSpan.innerHTML;
//       console.log('innerHTML >>> ', innerHTML);
//       let match = innerHTML.match(/\((\d+)\s*,/);
//       console.log('match >>> ', match);
//       if (match) {
//         let extractedNumber = +match[1];
//         console.log('extractedNumber >>> ', extractedNumber);
//         if ( extractedNumber === room ) {
//           alert(`Already exist. You can't join`);
//         } else {
//           join({room: room, display:display_name, token:null});
//         }
//       } else { // -- LOCALS -- 일 때 실행되는거 >> 최초 1회 시행.
//         join({room: room, display:display_name, token:null});
//       }
//     }, 5);
//   }, 0);
// }
function join22(room, desc, totalParticipants) {
  var display_name = $('#display_name').val();
  if (display_name == '') {
    alert('참석할 이름을 입력해야 합니다.');
    return;
  }
  if (totalParticipants < 20) { // 로컬 포함 5명이면 더 이상 못들어옴
    join({room: room, display:display_name, token:null});
  } else {
    alert('you can not join!!! Too many participants');
  }
}

function join({ room = myRoom, display = myName, token = null }) {
  console.log('join()... to '+ room);
  const joinData = {
    room,
    display,
    token,
  };

  socket.emit('join', {
    data: joinData, // 이 data에서 display가 이미 해당 방에 포함되어 있다면 막아라 로직 너헝야함.
    _id: getId(),
  });
}

function subscribe({ feed, room = myRoom, substream, temporal }) {
  const subscribeData = {
    room,
    feed,
  };

  if (typeof substream !== 'undefined') subscribeData.sc_substream_layer = substream;
  if (typeof temporal !== 'undefined') subscribeData.sc_temporal_layers = temporal;

  socket.emit('subscribe', {
    data: subscribeData,
    _id: getId(),
  });
}

function subscribeTo(peers, room = myRoom) {
  peers.forEach(({ feed }) => {
    subscribe({ feed, room });
  });
}

function trickle({ feed, candidate }) {
  const trickleData = candidate ? { candidate } : {};
  trickleData.feed = feed;
  const trickleEvent = candidate ? 'trickle' : 'trickle-complete';

  socket.emit(trickleEvent, {
    data: trickleData,
    _id: getId(),
  });
}

function configure({ feed, jsep, restart, substream, temporal }) {
  console.log('feed======', feed);
  const configureData = {
    feed,
    audio: true,
    video: true,
    data: true,
  };
  if (typeof substream !== 'undefined') configureData.sc_substream_layer = substream;
  if (typeof temporal !== 'undefined') configureData.sc_temporal_layers = temporal;
  if (jsep) configureData.jsep = jsep;
  if (typeof restart === 'boolean') configureData.restart = restart;

  const configId = getId();

  socket.emit('configure', {
    data: configureData,
    _id: configId,
  });

  if (jsep) pendingOfferMap.set(configId, { feed });
}
function configure_bitrate_audio_video(mode) {
  var feed = $('#local_feed').text();

  if (mode == 'bitrate') {
    var configureData = {
      feed,
      bitrate: '12800',
    };
    // var bitrate_label = ((bitrate / 1000) > 1000) ? (bitrate / 1000 / 1000) + 'M' : (bitrate / 1000) + 'K';
    // $('#Bandwidth_label').text(bitrate_label);
    socket.emit('configure', {
      data: configureData,
      _id: getId(),
    });
  
   
  } else if (mode =='audio') {
    if ($('#audioset').hasClass('btn-primary')) {
      $('#audioset').removeClass('btn-primary').addClass('btn-warning');
      console.log('오디오 켜기');
      var audioset = false;
      var vidTrack = localStream.getAudioTracks();
      vidTrack.forEach(track => track.enabled = false);      
    } else {
      $('#audioset').removeClass('btn-warning').addClass('btn-primary');
      console.log('오디오 끄기');
      var audioset = true;
      var vidTrack = localStream.getAudioTracks();
      vidTrack.forEach(track => track.enabled = true);      
    }
  } else {
    // 비디오를 끄는 것이면
    if ($('#videoset').hasClass('btn-primary')) {
      $('#videoset').removeClass('btn-primary').addClass('btn-warning');

      console.log('비디오 끄기');
      // var videoset = false;
      var vidTrack = localStream.getVideoTracks();
      vidTrack.forEach(track => track.enabled = false);      

    } else {
      $('#videoset').removeClass('btn-warning').addClass('btn-primary');
      
      console.log('비디오 켜기');
      // var videoset = true;
      var vidTrack = localStream.getVideoTracks();
      vidTrack.forEach(track => track.enabled = true);      

      
    }
  }

}

async function publishOwnFeed() {
  try {
    const offer = await doOffer(local_feed, local_display, false);
    configure({ feed: local_feed, jsep: offer, just_configure: false });
    // subscribeTo(data.publishers, data.room);
    // var vidTrack = localStream.getVideoTracks();
    // vidTrack.forEach(track => track.enabled = true);
    // var vidTrack = localStream.getAudioTracks();
    // vidTrack.forEach(track => track.enabled = true);

    $('#unpublish').text('Unpublish');
  } catch (e) {
    console.log('error while doing offer in publishOwnFeed()', e);
  }
}

function _unpublish({ feed }) {
  const unpublishData = {
    feed,
  };

  socket.emit('unpublish', {
    data: unpublishData,
    _id: getId(),
  });
}

function _leave({ feed }) {
  const leaveData = {
    feed,
  };

  console.log(leaveData);
  socket.emit('leave', {
    data: leaveData,
    _id: getId(),
  });
}
function _leaveAll({ feed }) {
  const leaveData = {
    feed,
  };

  console.log(leaveData);
  socket.emit('leaveAll', {
    data: leaveData,
    _id: getId(),
  });
}

function _listParticipants({ room = myRoom } = {}) {
  const listData = {
    room,
  };

  socket.emit('list-participants', {
    data: listData,
    _id: getId(),
  });
}

function _kick({ feed, room = myRoom, secret = 'adminpwd' }) {
  const kickData = {
    room,
    feed,
    secret,
  };

  socket.emit('kick', {
    data: kickData,
    _id: getId(),
  });
}

function start({ feed, jsep = null }) {
  const startData = {
    feed,
    jsep,
  };

  socket.emit('start', {
    data: startData,
    _id: getId(),
  });
}

function _pause({ feed }) {
  const pauseData = {
    feed,
  };

  socket.emit('start', {
    data: pauseData,
    _id: getId(),
  });
}


function _switch({ from_feed, to_feed, audio = true, video = true, data = false }) {
  const switchData = {
    from_feed,
    to_feed,
    audio,
    video,
    data,
  };

  socket.emit('switch', {
    data: switchData,
    _id: getId(),
  });
}

function _exists({ room = myRoom } = {}) {
  const existsData = {
    room,
  };

  socket.emit('exists', {
    data: existsData,
    _id: getId(),
  });
}

function _listRooms(desc) {
  socket.emit('list-rooms', { // socket.on('rooms-list' 이거랑 매칭 되네 ???
    _id: getId(),
    desc,
  });
}



function _destroy({ room = myRoom, permanent = false, secret = 'adminpwd' }) {
  socket.emit('destroy', {
    data: {
      room,
      permanent,
      secret,
    },
    _id: getId(),
  });
}

// add remove enable disable token mgmt
function _allow({ room = myRoom, action, token, secret = 'adminpwd' }) {
  const allowData = {
    room,
    action,
    secret,
  };
  if (action != 'disable' && token) allowData.list = [token];

  socket.emit('allow', {
    data: allowData,
    _id: getId(),
  });
}

function _startForward({ feed, room = myRoom, host = 'localhost', audio_port, video_port, data_port = null, secret = 'adminpwd' }) {
  socket.emit('rtp-fwd-start', {
    data: {
      room,
      feed,
      host,
      audio_port,
      video_port,
      data_port,
      secret,
    },
    _id: getId(),
  });
}

function _stopForward({ stream, feed, room = myRoom, secret = 'adminpwd' }) {
  socket.emit('rtp-fwd-stop', {
    data: {
      room,
      stream,
      feed,
      secret,
    },
    _id: getId(),
  });
}

function _listForward({ room = myRoom, secret = 'adminpwd' }) {
  socket.emit('rtp-fwd-list', {
    data: { room, secret },
    _id: getId(),
  });
}

socket.on('connect', () => {
  console.log('socket connected');
  $('#connect_status').val('connected');
  _listRooms();
  $('#connect').prop('disabled', true);
  $('#disconnect, #create_room, #list_rooms' ).prop('disabled', false);

  socket.sendBuffer = [];
  // var display_name = $('#display_name').val();
  // join({room: 1264989511454137, display:display_name, token:null});
  
  //scheduleConnection(0.1);
});

socket.on('disconnect', () => {
  console.log('socket disconnected');
  $('#connect_status').val('disconnected');
  $('#room_list').html('');
  $('#connect').prop('disabled', false);
  $('#disconnect, #create_room, #list_rooms, #leave_all' ).prop('disabled', true);
  pendingOfferMap.clear();
  removeAllVideoElements();
  closeAllPCs();
});

socket.on('leaveAll', () => {
  console.log('leaved all rooms');
  pendingOfferMap.clear();
  $('#leave_all').prop('disabled', true);
  $('#curr_room_name').val('');
  

  removeAllVideoElements();
  closeAllPCs();
  $('#local_feed').text('');
  $('#private_id').text('');
  _listRooms();

});

socket.on('videoroom-error', ({ error, _id }) => {
  alert(error);
  console.log('videoroom error', error);
  if (error === 'backend-failure' || error === 'session-not-available') {
    socket.disconnect();
    return;
  }
  if (pendingOfferMap.has(_id)) {
    const { feed } = pendingOfferMap.get(_id);
    removeVideoElementByFeed(feed);
    closePC(feed);
    pendingOfferMap.delete(_id);
    return;
  }
});

socket.on('joined', async ({ data }) => {
  $('#local_feed').text(data.feed);
  $('#private_id').text(data.private_id);
  $('#curr_room_name').val(data.description);
  $('#leave_all').prop('disabled', false);
  _listRooms(); 
  setLocalVideoElement(null, null, null, data.room, data.description); // description 추가함. 스크린 위에 표시하기 위해.
  try {
    console.log('1111111111111111111111');
    const offer = await doOffer(data.feed, data.display, false);
    console.log('222222222222222222222222');

    configure({ feed: data.feed, jsep: offer });
    subscribeTo(data.publishers, data.room);
    // localStream이 없으니까 에러가 나는 중
    // var vidTrack = localStream.getVideoTracks();
    // vidTrack.forEach(track => track.enabled = true); // 이게 false로 돼있어서 join시, 항상 꺼진 화면으로 시작됐음.
    // var vidTrack = localStream.getAudioTracks();
    // vidTrack.forEach(track => track.enabled = true);
  } catch (e) {
    console.log('조인할 떄 에러생김!! error while doing offer >>> ', e);
  }
});

socket.on('subscribed', async ({ data }) => {
  console.log('subscribed to feed', data);

  try {
    const answer = await doAnswer(data.feed, data.display, data.jsep);
    start({ feed: data.feed, jsep: answer });
    _listRooms();
  } catch (e) { console.log('error while doing answer', e); }
});

socket.on('participants-list', ({ data }) => {
  console.log('participants list', data);
});

socket.on('talking', ({ data }) => {
  console.log('talking notify', data);
});

socket.on('kicked', ({ data }) => {
  console.log('participant kicked', data);
  if (data.feed) {
    removeVideoElementByFeed(data.feed);
    closePC(data.feed);
  }
});

socket.on('allowed', ({ data }) => {
  console.log('token management', data);
});

socket.on('configured', async ({ data, _id }) => {
  console.log('feed configured >>> ', data);
  // 카메라가 있는 쪽에서는 data에 jsep가 있고, 
  // 카메라가 없는 쪽에서는 data에 jsep가 없음.
  pendingOfferMap.delete(_id);
  const pc = pcMap.get(data.feed);
  if (pc && data.jsep) {
    try {
      await pc.setRemoteDescription(data.jsep);
      console.log('configure remote sdp OK');
      console.log('data.jsep.type >>> ', data.jsep.type);
      if (data.jsep.type === 'offer') {
        console.log('answer 111 >>> ', answer);
        const answer = await doAnswer(data.feed, null, data.jsep);
        console.log('answer 222 >>> ', answer);
        start(data.feed, answer);

      }
    } catch (e) {
      console.log('error setting remote sdp', e);
    }
  }
});

socket.on('display', ({ data }) => {
  console.log('feed changed display name', data);
  setRemoteVideoElement(null, data.feed, data.display);
});

socket.on('started', ({ data }) => {
  console.log('subscribed feed started', data);
});

socket.on('paused', ({ data }) => {
  console.log('feed paused', data);
});

socket.on('switched', ({ data }) => {
  console.log(`feed switched from ${data.from_feed} to ${data.to_feed} (${data.display})`);
  /* !!! This will actually break the DOM management since IDs are feed based !!! */
  setRemoteVideoElement(null, data.from_feed, data.display);
});

socket.on('feed-list', ({ data }) => {
  console.log('new feeds available!', data);
  subscribeTo(data.publishers, data.room);
});

socket.on('unpublished', ({ data }) => {
  console.log('feed unpublished', data);
  if (data.feed) {
    removeVideoElementByFeed(data.feed);
    closePC(data.feed);
  }
});

socket.on('leaving', ({ data }) => {
  console.log('feed leaving', data);
  _listRooms();
  if (data.feed) {
    removeVideoElementByFeed(data.feed);
    closePC(data.feed);
    renderPage(currentPage);
  }
});

socket.on('exists', ({ data }) => {
  console.log('room exists', data);
});

socket.on('rooms-list', ({ data }) => {
  // console.log('data >>>>>> ', data); // janus.plugin.videoroom.jcfg 코드 에서 옴.
  // var parsedData = JSON.parse(data);
  $('#room_list').html('');
  data.list.forEach(rooms => { // data.list.forEach는 내꺼 돌아가고, parsedData.forEach는 peter꺼.
    // $('#room_list').html($('#room_list').html()+"<br>"+rooms.description +" ("+rooms.num_participants+" / "+rooms.max_publishers+")&nbsp;<button class='btn btn-primary btn-xs' onclick='join22("+rooms.room+", \""+rooms.description+"\");'>join</button>&nbsp;"+"<button class='btn btn-primary btn-xs' onclick='destroy_room("+rooms.room+", \""+rooms.description+"\");'>destroy</button>");
    $('#room_list').html($('#room_list').html()+"<br>"+rooms.description +" ("+rooms.num_participants+" / "+rooms.max_publishers+")&nbsp;<button class='btn btn-primary btn-xs' onclick='join22("+rooms.room+", \""+rooms.description + "\", "+rooms.num_participants+");'>join</button>&nbsp;"+"<button class='btn btn-primary btn-xs' onclick='destroy_room("+rooms.room+", \""+rooms.description+"\");'>destroy</button>");
  });
});

socket.on('created', ({ data }) => {
  console.log('room created', data);
  $('#new_room_name').val('');
  _listRooms();
});

socket.on('destroyed', ({ data }) => {
  console.log('room destroyed', data);
  _listRooms();
  // if (data.room === myRoom) {
  //   socket.disconnect();
  // }
});

socket.on('rtp-fwd-started', ({ data }) => {
  console.log('rtp forwarding started', data);
});

socket.on('rtp-fwd-stopped', ({ data }) => {
  console.log('rtp forwarding stopped', data);
});

socket.on('rtp-fwd-list', ({ data }) => {
  console.log('rtp forwarders list', data);
});

async function _restartPublisher(feed) {
  const offer = await doOffer(feed, null);
  configure({ feed, jsep: offer });
}

async function _restartSubscriber(feed) {
  configure({ feed, restart: true });
}

async function doOffer(feed, display) {
  if (!pcMap.has(feed)) {
    const pc = new RTCPeerConnection({
      'iceServers': [{
        urls: 'stun:stun.l.google.com:19302'
      }],
    });

    pc.onnegotiationneeded = event => console.log('pc.onnegotiationneeded', event);
    pc.onicecandidate = event => trickle({ feed, candidate: event.candidate });
    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'closed') {
        removeVideoElementByFeed(feed);
        closePC(feed);
      }
    };
    /* This one below should not be fired, cause the PC is used just to send */
    pc.ontrack = event => console.log('pc.ontrack', event);

    pcMap.set(feed, pc);

    console.log('pc >>>>> ', pc);
    console.log('됨?3') // 이거 나옴
    try {
      console.log('됨?3.5') // 이거 나옴
      localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true }); // 카메라가 없어도 문제가 되지 않고 있음.
      console.log('localStream 카메라 있을 때 >>> ', localStream);
      console.log('됨?4') // 이거 안나옴
      localStream.getTracks().forEach(track => {
        console.log('adding track >>> ', track);
        pc.addTrack(track, localStream); // 이걸 해줘야 할 듯, 카마레가 있든 없든.
      });
      setLocalVideoElement(localStream, feed, display);
    } catch (e) {
      localStream = new MediaStream(); // 빈 미디어 스트림 생성
      console.log('카메라 없음!!! error while doing offer >>> ', e, localStream);
      localStream.getTracks().forEach(track => {
        console.log('adding track >>> ', track);
        pc.addTrack(track, localStream); // 이걸 해줘야 할 듯, 카마레가 있든 없든.
      });
      setLocalVideoElement(localStream, feed, display); // localStream 자리에 null을 넣음으로써 video, audio가 들어오지 않음을 표시
      // setLocalVideoElement(localStream, feed, display); // localStream 자리에 null을 넣음으로써 video, audio가 들어오지 않음을 표시
      // removeVideoElementByFeed(feed);
      // closePC(feed);
      return;
    }
  }
  else {
    console.log('Performing ICE restart');
    pcMap.get(feed).restartIce();
  }

  try {
    const pc = pcMap.get(feed);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    console.log('set local sdp OK');
    return offer;
  } catch (e) {
    console.log('error while doing offer', e);
    removeVideoElementByFeed(feed);
    closePC(feed);
    return;
  }

}

async function doAnswer(feed, display, offer) {
  console.log('이건되고있나???????????')
  if (!pcMap.has(feed)) {
    const pc = new RTCPeerConnection({
      'iceServers': [{
        urls: 'stun:stun.l.google.com:19302'
      }],
    });

    pc.onnegotiationneeded = event => console.log('pc.onnegotiationneeded', event);
    pc.onicecandidate = event => trickle({ feed, candidate: event.candidate });
    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'closed') {
        removeVideoElementByFeed(feed);
        closePC(feed);
      }
    };
    pc.ontrack = event => {
      console.log('pc.ontrack >>> ', event);

      event.track.onunmute = evt => {
        console.log('track.onunmute', evt);
        /* TODO set srcObject in this callback */
      };
      event.track.onmute = evt => {
        console.log('track.onmute', evt);
      };
      event.track.onended = evt => {
        console.log('track.onended', evt);
      };

      const remoteStream = event.streams[0];
      // 지금 여기까지도 안 오는 듯.
      console.log('remoteStream >>>>> ', remoteStream);
      // setRemoteVideoElement(remoteStream, feed, display);

      if (remoteStream) {
        console.log('hihihihi')
        setRemoteVideoElement(remoteStream, feed, display);
      } else {
        console.log('byebyebye')
        setRemoteVideoElement(null, feed, display);
      }
    };

    pcMap.set(feed, pc);
  }

  const pc = pcMap.get(feed);

  try {
    await pc.setRemoteDescription(offer);
    console.log('set remote sdp OK');
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    console.log('set local sdp OK');
    return answer;
  } catch (e) {
    console.log('error creating subscriber answer', e);
    removeVideoElementByFeed(feed);
    closePC(feed);
    throw e;
  }
}

function setLocalVideoElement(localStream, feed, display, room, description) {
  if (room) document.getElementById('videos').getElementsByTagName('span')[0].innerHTML = '   --- VIDEOROOM (' + room + ' , ' + description +') ---  '; // 로컬 --- LOCALS --- 에서 치환
  if (!feed) return;

  if (!document.getElementById('video_' + feed)) {
    const nameElem = document.createElement('span');
    nameElem.innerHTML = display + '(' + feed + ')'; // 스크린 위 표시
    nameElem.style.display = 'table';

    if (localStream) {
      console.log('Yes localStream')
      const localVideoStreamElem = document.createElement('video');
      //localVideo.id = 'video_'+feed;
      localVideoStreamElem.width = 320;
      localVideoStreamElem.height = 240;
      localVideoStreamElem.autoplay = true;
      localVideoStreamElem.muted = 'muted';
      localVideoStreamElem.style.cssText = '-moz-transform: scale(-1, 1); -webkit-transform: scale(-1, 1); -o-transform: scale(-1, 1); transform: scale(-1, 1); filter: FlipH;';
      localVideoStreamElem.srcObject = localStream;

      const localVideoContainer = document.createElement('div');
      localVideoContainer.id = 'video_' + feed;
      localVideoContainer.appendChild(nameElem);
      localVideoContainer.appendChild(localVideoStreamElem);

      document.getElementById('locals').appendChild(localVideoContainer);
    } else {
      console.log('No localStream')
      const blackScreenElem = document.createElement('div');
      blackScreenElem.style.width = '320px';
      blackScreenElem.style.height = '240px';
      blackScreenElem.style.backgroundColor = 'black';
    
      const localVideoContainer = document.createElement('div');
      localVideoContainer.id = 'video_' + feed;
      localVideoContainer.appendChild(nameElem);
      localVideoContainer.appendChild(blackScreenElem);
    
      document.getElementById('locals').appendChild(localVideoContainer);
    }
  } else {
    const localVideoContainer = document.getElementById('video_' + feed);
    if (display) {
      const nameElem = localVideoContainer.getElementsByTagName('span')[0]; // 이게 뭐지??
      nameElem.innerHTML = display + ' (' + feed + ')';
    }
    const localVideoStreamElem = localVideoContainer.getElementsByTagName('video')[0];
    if (localStream)
      localVideoStreamElem.srcObject = localStream;
  }
}

document.getElementById('js-pagination').addEventListener('click', (event) => {
  if (event.target.tagName === 'BUTTON') {
    currentPage = parseInt(event.target.textContent);
    renderPage(currentPage);
  }
});

const itemsPerPage = 5;
let currentPage = 1;

function renderPage(pageNumber) {
  
  const startIndex = (pageNumber - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const remoteContainers = document.querySelectorAll('#remotes > div');
  const paginationContainer = document.getElementById('js-pagination');
  paginationContainer.innerHTML = '';

  remoteContainers.forEach((container, index) => { 
    if (index >= startIndex && index < endIndex) {
      container.style.display = 'block';
      // 여기서 연결해주는 행위를 하고
    } else {
      container.style.display = 'none';
      // 여기서 끊어주는 행위를 하면 되지 않을까? feedliving이나 뭐 그런거.
    }
  });

  const totalItems = remoteContainers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (pageNumber > totalPages) {
    currentPage = totalPages > 0 ? totalPages : 1;
  // return renderPage(currentPage); // 여기서 계속 재귀함수 호출되고 있었음. maximum call stack 초과에러 지워주는 코드.
  } else if ( pageNumber < 1) {
    pageNumber = 1;
  }

  for (let i = 1; i <= totalPages; i++) {
    const pageButton = document.createElement('button');
    pageButton.textContent = i;
    pageButton.className = 'pagination-button';

    if (i === pageNumber) {
      pageButton.classList.add('clicked');
    }

    paginationContainer.appendChild(pageButton);
    pageButton.addEventListener('click', function() {
      const previouslyClickedButton = paginationContainer.querySelector('.pagination-button.clicked');
      if (previouslyClickedButton) {
        previouslyClickedButton.classList.remove('clicked');
      }
      
      this.classList.add('clicked');  // 이건 지워줘도 되지 않을까? 위에 i === pageNumber가 있으니까

      currentPage = parseInt(this.textContent);
      renderPage(currentPage);
    });
  } 
}

// 이거 조차 실행이 안되고 있음.
function setRemoteVideoElement(remoteStream, feed, display) {
  if (!feed) return;

  if (!document.getElementById('video_' + feed)) {
    const nameElem = document.createElement('span');
    nameElem.innerHTML = display + ' (' + feed + ')';
    nameElem.style.display = 'table';


    if (remoteStream) {

      console.log('Yes RemoteStream')
      const remoteVideoStreamElem = document.createElement('video');
      remoteVideoStreamElem.width = 320;
      remoteVideoStreamElem.height = 240;
      remoteVideoStreamElem.autoplay = true;
      remoteVideoStreamElem.style.cssText = '-moz-transform: scale(-1, 1); -webkit-transform: scale(-1, 1); -o-transform: scale(-1, 1); transform: scale(-1, 1); filter: FlipH;';
      remoteVideoStreamElem.srcObject = remoteStream;

      const remoteVideoContainer = document.createElement('div');
      remoteVideoContainer.id = 'video_' + feed;
      remoteVideoContainer.classList.add('remote-container');
      remoteVideoContainer.appendChild(nameElem);
      remoteVideoContainer.appendChild(remoteVideoStreamElem);

      document.getElementById('remotes').appendChild(remoteVideoContainer);

    } else {
      console.log('No RemoteStream')
      const blackScreenElem = document.createElement('div');
      blackScreenElem.style.width = '320px';
      blackScreenElem.style.height = '240px';
      blackScreenElem.style.backgroundColor = 'black';
    
      const localVideoContainer = document.createElement('div');
      localVideoContainer.id = 'video_' + feed;
      localVideoContainer.appendChild(nameElem);
      localVideoContainer.appendChild(blackScreenElem);
    
      document.getElementById('remotes').appendChild(localVideoContainer);
    }

    renderPage(currentPage);

    const remoteContainers = document.querySelectorAll('.remote-container');
    const paginationContainer = document.getElementById('js-pagination');
    paginationContainer.innerHTML = '';
    
    const totalItems = remoteContainers.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    for (let i = 1; i <= totalPages; i++) {
      const pageButton = document.createElement('button');
      pageButton.textContent = i;
      pageButton.className = 'pagination-button';
      
      if(i === currentPage) {
        pageButton.classList.add('clicked');
      } 
      
      paginationContainer.appendChild(pageButton); 
    }
  }
  else {
    const remoteVideoContainer = document.getElementById('video_' + feed);
    if (display) {
      const nameElem = remoteVideoContainer.getElementsByTagName('span')[0];
      nameElem.innerHTML = display + ' (' + feed + ')';
    }
    if (remoteStream) {
      const remoteVideoStreamElem = remoteVideoContainer.getElementsByTagName('video')[0];
      remoteVideoStreamElem.srcObject = remoteStream;
    }
  }
}

function removeVideoElementByFeed(feed, stopTracks = true) {
  const videoContainer = document.getElementById(`video_${feed}`);
  if (videoContainer) removeVideoElement(videoContainer, stopTracks);
}

function removeVideoElement(container, stopTracks = true) {
  // let videoStreamElem = container.getElementsByTagName('video').length > 0 ? container.getElementsByTagName('video')[0] : null;
  let videoStreamElem = container.getElementsByTagName('video') && container.getElementsByTagName('video')[0];
  if (videoStreamElem && videoStreamElem.srcObject && stopTracks) {
    videoStreamElem.srcObject.getTracks().forEach(track => track.stop());
    videoStreamElem.srcObject = null;
  }
  container.remove();
}

function removeAllVideoElements() {
  const locals = document.getElementById('locals');
  const localVideoContainers = locals.getElementsByTagName('div');
  for (let i = 0; localVideoContainers && i < localVideoContainers.length; i++)
    removeVideoElement(localVideoContainers[i]);
  while (locals.firstChild)
    locals.removeChild(locals.firstChild);

  var remotes = document.getElementById('remotes');
  const remoteVideoContainers = remotes.getElementsByTagName('div');
  for (let i = 0; remoteVideoContainers && i < remoteVideoContainers.length; i++)
    removeVideoElement(remoteVideoContainers[i]);
  while (remotes.firstChild)
    remotes.removeChild(remotes.firstChild);
  document.getElementById('videos').getElementsByTagName('span')[0].innerHTML = '   --- VIDEOROOM () ---  ';
}

function _closePC(pc) {
  if (!pc) return;
  pc.getSenders().forEach(sender => {
    if (sender.track)
      sender.track.stop();
  });
  pc.getReceivers().forEach(receiver => {
    if (receiver.track)
      receiver.track.stop();
  });
  pc.onnegotiationneeded = null;
  pc.onicecandidate = null;
  pc.oniceconnectionstatechange = null;
  pc.ontrack = null;
  pc.close();
}

function closePC(feed) {
  if (!feed) return;
  let pc = pcMap.get(feed);
  console.log('closing pc for feed', feed);
  _closePC(pc);
  pcMap.delete(feed);
}

function closeAllPCs() {
  console.log('closing all pcs');

  pcMap.forEach((pc, feed) => {
    console.log('closing pc for feed', feed);
    _closePC(pc);
  });

  pcMap.clear();
}
