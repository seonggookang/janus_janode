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
  else {
    console.log('생성한 방 이름 create onclick---- ', $('#new_room_name').val());
    const secondRoom = document.createElement('div');
    secondRoom.id = $('#new_room_name').val(); // id값 넣어주고.. 여기서 room의 room( 16자리 난수로는 못넣어주나? )
    secondRoom.innerHTML = 
    `------------------------------------------------------------------------------------------------------------
     <br>    
     <span style="font-size: 32px; color: yellow;">Room name : ${$('#new_room_name').val()}</span> 
     <br><br>

     <div style="border: 2px; border-color: blueviolet;">
      <div id="locals_${$('#new_room_name').val()}" style="display: flex;"></div>
      <div>
        <button id="unpublish" class="btn btn-primary btn-xs btn_between">Unpublish</button>
        <button id="audioset" onclick="configure_bitrate_audio_video('audio');"
          class="btn btn-primary btn-xs btn_between">Audio</button>
        <button id="videoset" onclick="configure_bitrate_audio_video('video');"
          class="btn btn-primary btn-xs btn_between">Video</button>
        <div class="btn-group btn-group-xs">
          <button id="bitrateset" autocomplete="on"
            class="btn btn-primary btn-xs btn_between dropdown-toggle" data-toggle="dropdown">
            <span id="Bandwidth_label">128K</span><span class="caret"></span>
          </button>
          <ul id="bitrate" class="dropdown-menu" role="menu">
            <li><a href="#" id="0" onclick="configure_bitrate_audio_video('bitrate', 0);">No limit</a></li>
            <li><a href="#" id="32" onclick="configure_bitrate_audio_video('bitrate',32000);">Cap to 32kbit</a></li>
            <li><a href="#" id="64" onclick="configure_bitrate_audio_video('bitrate',64000);">Cap to 64kbit</a></li>
            <li><a href="#" id="128" onclick="configure_bitrate_audio_video('bitrate',128000);">Cap to 128kbit</a></li>
            <li><a href="#" id="256" onclick="configure_bitrate_audio_video('bitrate', 256000);">Cap to 256kbit</a></li>
            <li><a href="#" id="512" onclick="configure_bitrate_audio_video('bitrate', 512000);">Cap to 512kbit</a></li>
            <li><a href="#" id="1024" onclick="configure_bitrate_audio_video('bitrate', 1024000);">Cap to 1mbit</a></li>
            <li><a href="#" id="1500" onclick="configure_bitrate_audio_video('bitrate', 1500000);">Cap to 1.5mbit</a></li>
            <li><a href="#" id="2000" onclick="configure_bitrate_audio_video('bitrate', 2000000);">Cap to 2mbit</a></li>
          </ul>
         </div>
       </div>
     </div>

    <br> 
    -- REMOTES -- 
    <br><br>`;
  
    const firstRoom = document.getElementById('videos');
    firstRoom.parentNode.appendChild(secondRoom);

    _create({ 
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
  }
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

// const socket = io('https://192.168.50.156:4443/'); // localhost (Peter 주소)
// const socket = io('https://192.168.50.116:4443/'); // ifconfig << 이건 동작 X
// const socket = io('https://192.168.50.19:4443/'); // ipconfig
const socket = io("https://localhost:4443"); // 내 주소
// const socket = io({
//   rejectUnauthorized: false,
//   autoConnect: false,
//   reconnection: false,
// });

function destroy_room(room, desc) {
    if (confirm(desc + ' room을 삭제하겠습니까?')) {
      _destroy({ room : room, permanent : true, secret : 'adminpwd' }); // permanent를 true로 설정해서 영구히 삭제 - by Steve
    }
};


function join22(room, desc) {
  var display_name = $('#display_name').val();
  if (display_name == '') {
    alert('참석할 이름을 입력해야 합니다.');
    return;
  }

  console.log('내가 방금 클릭한 방의 desc >>> ', desc); // 이거랑 list room의 description foreach돌려서 일치하는게 나오면...
  // console.log('id가 로컬인거 >> ', document.getElementById('locals')); // 바로 dom으로 잡히지가 않네..
  let spanContext = document.getElementById('locals');
  let spanEl = spanContext.querySelector('span');
  let content = spanEl && spanEl.textContent;
  let extractContent = content && content.substring(0, content.indexOf('('));
  console.log('spanContext >>> ', spanContext);
  console.log('spanEl >>> ', spanEl);
  console.log('content >>> ', content);
  console.log('extractContent >>> ', extractContent); // 이건 화면 바로위의 참석자 이름이고, -- VIDEOROOM에 있는 room description 찾아야지
  
  let videosElement = document.getElementById('videos');
  console.log('videos >> ', document.getElementById('videos')); // 여기에서는    --- VIDEOROOM (9408726668196596 , 111) ---  이걸 잘 잡힘
  setTimeout(() => {
    let firstSpan = videosElement.querySelector('span'); // --- VIDEOROOM (9408726668196596 , 111) --- 잘 가져옴.
    console.log('firstSpan >>> ', firstSpan);
    setTimeout(() => {
      let innerHTML = firstSpan.innerHTML;
      console.log('innerHTML >>> ', innerHTML);
      let match = innerHTML.match(/\((\d+)\s*,/); // VIDEOROOM 괄호 안의 첫번째 인자 >> room의 16자리 난수, 9408726668196596
      console.log('match >>> ', match);
      if (match) {
        let extractedNumber = +match[1]; // match 배열의 두 번째 요소가 추출된 숫자(+는 숫자화)
        console.log('setTimeout 안의 room >>> ', room);
        console.log('setTimeout 안의 extractedNumber >>> ', extractedNumber);
        if ( extractedNumber === room ) {
          alert(`Already exist. You can't join`);
          console.log('extractedNumber === room 일치') // 아무것도 없는 상태에서도 일치라는 값이 나온다..
        } else {
          console.log('extractedNumber === room 불일치')
          join({room: room, display:display_name, token:null});
        }
      } else { // -- LOCALS -- 일 때 실행되는거 >> 최초 1회 시행.
        join({room: room, display:display_name, token:null});
      }
    }, 5); // 5ms
  }, 0);
  
  // join({room: room, display:display_name, token:null});
  // if ( display_name === extractContent && 'list room을 forEach로 돌려서, --- VIDEOROOM (~~~, room description << 이거랑  일치하는게 있으면 실행) ---'){ // 여기에 조건을 하나 더 둬야겠는데? 지금은 무조건 막아버리고 있자나. 
  //   alert(`Already exist. You can't join`);
  // } else {
  //   console.log('기존에 없는 display다. join 가즈아ㅏㅏㅏㅏㅏㅏㅏㅏㅏ!')
  //   join({room: room, display:display_name, token:null});
  // }
  
  // 이 밑처럼 할 필요가 없는게 이미 join22를 누를 때 내가 뭘 눌렀는지 알 수 가 있음. 예를 들어,
  console.log('내가 뭘 눌렀나에 대한 정보 >> ' , room, desc); // 9408726668196596 111
  // 그니까 뭐 아래처럼 또 루프를 돌릴 필요가 없는거지. 주석 처리해 일단.
  // 이제 나온 정보 room이랑 위에서 뽑은 extractedNumber랑 매칭 시켜서 맞으면 join NO!, 매칭 안되면 join!
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
  console.log('feed >> ', feed);
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
function configure_bitrate_audio_video(mode, bitrate=0) {
  let feed = parseInt($('#local_feed').text());

  if (mode == 'bitrate') {
    let configureData = {
      feed,
      bitrate: bitrate,
    };
    let bitrate_label = ((bitrate / 1000) > 1000) ? (bitrate / 1000 / 1000) + 'M' : (bitrate / 1000) + 'K';
    $('#Bandwidth_label').text(bitrate_label);
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
  console.log('joined data >> ', data);
  $('#local_feed').text(data.feed);
  $('#private_id').text(data.private_id);
  $('#curr_room_name').val(data.description);
  $('#leave_all').prop('disabled', false);
  _listRooms(); 
  setLocalVideoElement(null, null, null, data.room, data.description); // description 추가함. 스크린 위에 표시하기 위해.
  try {
    const offer = await doOffer(data.feed, data.display, false);
    configure({ feed: data.feed, jsep: offer });
    subscribeTo(data.publishers, data.room);
    var vidTrack = localStream.getVideoTracks();
    vidTrack.forEach(track => track.enabled = true); // 이게 false로 돼있어서 join시, 항상 꺼진 화면으로 시작됐음.
    var vidTrack = localStream.getAudioTracks();
    vidTrack.forEach(track => track.enabled = true);

  } catch (e) {
    console.log('error while doing offer', e);
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
  console.log('feed configured', data);
  pendingOfferMap.delete(_id);
  const pc = pcMap.get(data.feed);
  if (pc && data.jsep) {
    try {
      await pc.setRemoteDescription(data.jsep);
      console.log('configure remote sdp OK');
      if (data.jsep.type === 'offer') {
        const answer = await doAnswer(data.feed, null, data.jsep);
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
  }
});

socket.on('exists', ({ data }) => {
  console.log('room exists', data);
});

socket.on('rooms-list', ({ data }) => {
  // console.log('어떤 방들이 존재하나? >> ', data.list); // janus.plugin.videoroom.jcfg 코드 에서 옴.
  // var parsedData = JSON.parse(data);
  // console.log('data in rooms-list >>>>>> ', data); // 서버로 부터 오는 정보.
  $('#room_list').html('');
  data.list.forEach(rooms => { // data.list.forEach는 내꺼 돌아가고, parsedData.forEach는 peter꺼.
    $('#room_list').html($('#room_list').html()+"<br>"+rooms.description +" ("+rooms.num_participants+" / "+rooms.max_publishers+")&nbsp;<button class='btn btn-primary btn-xs' onclick='join22("+rooms.room+", \""+rooms.description+"\");'>join</button>&nbsp;"+"<button class='btn btn-primary btn-xs' onclick='destroy_room("+rooms.room+", \""+rooms.description+"\");'>destroy</button>");
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

    try {
      localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      localStream.getTracks().forEach(track => {
        console.log('adding track', track);
        pc.addTrack(track, localStream);
      });
      setLocalVideoElement(localStream, feed, display);
    } catch (e) {
      console.log('error while doing offer', e);
      removeVideoElementByFeed(feed);
      closePC(feed);
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
      console.log('pc.ontrack', event);

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
      setRemoteVideoElement(remoteStream, feed, display);
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
  console.log('room >> ', room); // 16자리 난수 값
  console.log('description >> ', description); // 16자리 난수 값
  // if (room) document.getElementById('videos').getElementsByTagName('span')[0].innerHTML = '--- VIDEOROOM (' + room + ' , ' + description +') ---'; // 로컬 --- LOCALS --- 에서 치환
  if (room) document.getElementById(description).getElementsByTagName('span')[0].innerHTML = '--- VIDEOROOM (' + room + ' , ' + description +') ---'; // 로컬 --- LOCALS --- 에서 치환
  if (!feed) return;

  if (!document.getElementById('video_' + feed)) {
    const nameElem = document.createElement('span');
    nameElem.innerHTML = display + '(' + feed + ')'; // 스크린 위 표시
    nameElem.style.display = 'table';

    if (localStream) {
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
      console.log('locals >> ', document.getElementById('locals'));
      console.log('description >> ', document.getElementById(description));
      document.getElementById('locals').appendChild(localVideoContainer); // 여기서 새롭게 들어온 유저들이 계속 locals뒤에 붙는 형식. 다른 방을 만들어 그 방의 locals에 붙이는 형식으로 바꿔야함.
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


////// join을 누른순간 새로운 Room에 대한 저옵가 아래로 추가 되고 화면이 띄워져야지.
function newRoomJoin(localStream, feed, display, room, description) {
  
  const firstVideosTag = document.getElementById('videos')

  const localVideoStreamElem = document.createElement('videos');
  const localVideoFirstLine = document.createElement('span');
  localVideoFirstLine.innerHTML = display + '(' + feed + ')'; // 스크린 위 표시
  nameElem.style.display = 'table';
  localVideoStreamElem.appendChild(localVideoFirstLine)
  firstVideosTag.appendChild(localVideoFirstLine);
  

}
///////



function setRemoteVideoElement(remoteStream, feed, display) {
  if (!feed) return;

  if (!document.getElementById('video_' + feed)) {
    const nameElem = document.createElement('span');
    nameElem.innerHTML = display + ' (' + feed + ')';
    nameElem.style.display = 'table';

    const remoteVideoStreamElem = document.createElement('video');
    remoteVideoStreamElem.width = 320;
    remoteVideoStreamElem.height = 240;
    remoteVideoStreamElem.autoplay = true;
    remoteVideoStreamElem.style.cssText = '-moz-transform: scale(-1, 1); -webkit-transform: scale(-1, 1); -o-transform: scale(-1, 1); transform: scale(-1, 1); filter: FlipH;';
    if (remoteStream)
      remoteVideoStreamElem.srcObject = remoteStream;

    const remoteVideoContainer = document.createElement('div');
    remoteVideoContainer.id = 'video_' + feed;
    remoteVideoContainer.appendChild(nameElem);
    remoteVideoContainer.appendChild(remoteVideoStreamElem);

    document.getElementById('remotes').appendChild(remoteVideoContainer);
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
