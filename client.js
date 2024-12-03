// Kết nối đến server qua Socket.IO
const socket = io('https://video-3-8shi.onrender.com');

// Lưu trữ các video stream của người tham gia
const participants = {};

// Các phần tử trong DOM
const videoGrid = document.getElementById('videoGrid');
const toggleMicButton = document.getElementById('toggleMic');
const toggleCameraButton = document.getElementById('toggleCamera');
const shareScreenButton = document.getElementById('shareScreen');
const endCallButton = document.getElementById('endCall');

let localStream;
let isMicOn = true;
let isCameraOn = true;

// Thêm video stream vào giao diện
function addVideoStream(name, stream, isLocal = false) {
    const videoParticipant = document.createElement('div');
    videoParticipant.classList.add('videoParticipant');

    const video = document.createElement('video');
    if (stream) {
        video.srcObject = stream;
    }
    video.autoplay = true;
    video.playsInline = true;

    const nameLabel = document.createElement('div');
    nameLabel.classList.add('name');
    nameLabel.textContent = name;

    videoParticipant.appendChild(video);
    videoParticipant.appendChild(nameLabel);
    videoGrid.appendChild(videoParticipant);

    if (isLocal) {
        participants[name] = stream;
    }
}

// Bắt đầu video
async function startVideo() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        addVideoStream('Bạn', localStream, true);
        socket.emit('user-joined', { username: 'Bạn', stream: localStream });
    } catch (err) {
        console.error("Không thể truy cập camera/mic:", err);
    }
}

// Tắt/Bật mic
toggleMicButton.addEventListener('click', () => {
    if (localStream) {
        isMicOn = !isMicOn;
        localStream.getAudioTracks().forEach(track => (track.enabled = isMicOn));
        toggleMicButton.textContent = isMicOn ? '🎤 Mic Bật' : '🔇 Mic Tắt';
    }
});

// Tắt/Bật camera
toggleCameraButton.addEventListener('click', () => {
    if (localStream) {
        isCameraOn = !isCameraOn;
        localStream.getVideoTracks().forEach(track => (track.enabled = isCameraOn));
        toggleCameraButton.textContent = isCameraOn ? '📹 Camera Bật' : '🚫 Camera Tắt';
    }
});

// Chia sẻ màn hình
shareScreenButton.addEventListener('click', async () => {
    try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        addVideoStream('Chia sẻ màn hình', screenStream);
        screenStream.getVideoTracks()[0].addEventListener('ended', () => {
            videoGrid.innerHTML = ''; // Xóa stream khi ngừng chia sẻ
            Object.keys(participants).forEach((name) => {
                addVideoStream(name, participants[name]);
            });
        });
    } catch (err) {
        console.error("Không thể chia sẻ màn hình:", err);
    }
});

// Kết thúc cuộc gọi
endCallButton.addEventListener('click', () => {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop()); // Dừng tất cả các track của localStream
    }
    socket.emit('user-left', { username: 'Bạn' }); // Thông báo người dùng rời phòng
    window.location.reload(); // Reload lại trang khi kết thúc cuộc gọi
});

// Xử lý các sự kiện từ server
socket.on('new-participant', (data) => {
    addVideoStream(data.username, data.stream);
});

socket.on('participant-left', (username) => {
    // Loại bỏ video của người tham gia rời đi
    document.querySelectorAll('.videoParticipant').forEach(videoElement => {
        if (videoElement.querySelector('.name').textContent === username) {
            videoGrid.removeChild(videoElement);
        }
    });
});

// Bắt đầu video khi trang tải xong
window.onload = startVideo;
