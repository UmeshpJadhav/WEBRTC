const socket = io();

let local;
let remote;
let peerConnection;


const rtcSettings = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:19302" },
        { urls: "stun:stun4.l.google.com:19302" }
      ]
};


const initialize = async () => {
  socket.on("signalingMessage", handleSignalingMessage);
  
  local = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  });
  
  document.querySelector("#localVideo").srcObject = local;
  
  
  setupControlButtons();
  
  initiateOffer();
};


const initiateOffer = async () => {
  await createPeerConnection();
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  
  socket.emit("signalingMessage", JSON.stringify({ type: "offer", offer }));
};


const createPeerConnection = async () => {
  peerConnection = new RTCPeerConnection(rtcSettings);
  

  remote = new MediaStream();
  
  
  document.querySelector("#remoteVideo").srcObject = remote;
  document.querySelector("#remoteVideo").style.display = "block";
  document.querySelector("#localVideo").classList.add("video-player");
  
  
  local.getTracks().forEach(track => {
    peerConnection.addTrack(track, local);
  });
  
  
  peerConnection.ontrack = (event) => 
    event.streams[0].getTracks().forEach((track) => remote.addTrack(track));
  
 
  peerConnection.onicecandidate = (event) => 
    event.candidate && socket.emit("signalingMessage", 
      JSON.stringify({type: "candidate", candidate: event.candidate }));
};


const handleSignalingMessage = async (message) => {
  const { type, offer, answer, candidate } = JSON.parse(message);
  
  if(type === "offer") handleOffer(offer);
  if(type === "answer") handleAnswer(answer);
  if(type === "candidate" && peerConnection) {
    peerConnection.addIceCandidate(candidate);
  }
};


const handleOffer = async (offer) => {
  await createPeerConnection();
  await peerConnection.setRemoteDescription(offer);
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  
  socket.emit("signalingMessage", JSON.stringify({type: "answer", answer}));
};


const handleAnswer = async (answer) => {
  if(!peerConnection.currentRemoteDescription){
    await peerConnection.setRemoteDescription(answer);
  }
};


const setupControlButtons = () => {
  const cameraButton = document.getElementById("cameraButton");
  const micButton = document.getElementById("micButton");
  
  
  cameraButton.addEventListener("click", () => {
    const videoTrack = local.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      cameraButton.classList.toggle("active", !videoTrack.enabled);
    }
  });
  
  
  micButton.addEventListener("click", () => {
    const audioTrack = local.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      micButton.classList.toggle("active", !audioTrack.enabled);
    }
  });


  hangupButton.addEventListener("click", hangup);

};


const hangup = () => {
 
  if (local) {
    local.getTracks().forEach(track => track.stop());
  }

  
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }

  
  if (remote) {
    remote.getTracks().forEach(track => track.stop());
  }

 
  document.querySelector("#localVideo").srcObject = null;
  document.querySelector("#remoteVideo").srcObject = null;

  
  socket.emit("hangup");

  console.log("Call ended. Hangup complete.");

  
  window.location.href = "https://omegle-smgn.vercel.app/";
};



initialize();