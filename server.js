// Import các thư viện cần thiết
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

// Khởi tạo ứng dụng Express
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Cung cấp các file tĩnh (như HTML, CSS, JS) cho client
app.use(express.static('public'));

// Danh sách các phòng video
let rooms = {};

// Khi có kết nối mới từ client
io.on('connection', (socket) => {
    console.log('Có người dùng mới kết nối: ', socket.id);

    // Xử lý khi người tham gia vào phòng
    socket.on('user-joined', (data) => {
        const { username, stream } = data;

        // Thêm người tham gia vào phòng
        rooms[socket.id] = { username, stream };

        // Phát lại sự kiện cho các client còn lại trong phòng
        socket.broadcast.emit('new-participant', { username, stream });

        console.log(`${username} đã tham gia vào phòng`);
    });

    // Xử lý khi người tham gia rời phòng
    socket.on('user-left', (data) => {
        const { username } = data;

        // Loại bỏ người tham gia khỏi danh sách
        delete rooms[socket.id];

        // Phát lại sự kiện cho các client còn lại trong phòng
        socket.broadcast.emit('participant-left', username);

        console.log(`${username} đã rời phòng`);
    });

    // Khi kết nối bị ngắt
    socket.on('disconnect', () => {
        console.log('Một người tham gia đã rời đi:', socket.id);

        // Nếu người tham gia này có video stream, thông báo cho các client còn lại
        if (rooms[socket.id]) {
            const { username } = rooms[socket.id];
            socket.broadcast.emit('participant-left', username);
            delete rooms[socket.id];
        }
    });
});

// Khởi động server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
