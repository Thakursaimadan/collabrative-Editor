import { Server } from "socket.io";

const PORT = 9000;

const io=new Server(9000, {
  cors: {
    origin: "http://localhost:3000",
    methods: ['GETS','POST']
  },
});
io.on('connection',socket=>{

    socket.on('send-changes',delta=>{
        console.log(delta);
    })
    console.log("connected");
})