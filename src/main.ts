import * as express from "express"
import { roomsCollection, usersCollection, RTDB } from "./DBCon";
import * as cors from "cors"
import { firestore } from "firebase-admin";
import {nanoid} from "nanoid"

const app = express();
const port = 3000;
app.use(express.json());
app.use(cors()); 

app.get("/",(req,res)=>{
    res.send("funciona")
})

//SINGUP
app.post("/signup", (req, res) => {
  const {email} = req.body
  const {userName} = req.body
  const {password} = req.body
  //buscamos valores en la bd usando la FS where y le pasamos los 3 params para que busque
  if(userName != '' && email != '' && password != ''){
    usersCollection.where('userName','==',userName)
    .get()
    .then(data=>{
        //comprobamos si el email existe usando .empty y sino existe creamos un usuario
      if(data.empty){
          
          usersCollection.add({
              email,
              userName,
              password
          }).then(newUserRef =>{
              res.json({
                  newUserId: newUserRef.id
              })
          })
      }else{
          //si la funcion where encontro un email ya registrado en la BD no crea el usuario
          //la funcion where siempre debuelve un array por eso siempre hay que indicar la posicion
          // del dato que queremos usar dentro de ese array
  
          const datos = usersCollection.doc(data.docs[0].id)
          datos.get()
          .then(user=>{
              const usuario =user.data()
              res.status(400).json(
                  {message:"el nombre de usuario " + usuario.userName + " ya se encuentra registrado"}
              )
          }) 
      }
    })
  }else{
      console.log('error')
  }
  
})

//LOGIN
app.post("/login",(req, res)=>{
    console.log
const {userName} = req.body;
const {password} = req.body;
usersCollection.where('userName', '==', userName)
.get()
.then(data=>{
  if(data.empty){
    res.status(400).json(
        {message:"not Found "}
    )
  }else{
      //comprobar que la contraseña ingresada req.body sea igual a la de la db
       usersCollection.doc(data.docs[0].id)
      .get()
      .then(user=>{
          const usuario = user.data()
          if(password.toString() === usuario.password){
            res.status(200).json({userId:data.docs[0].id})
          }else{
              res.status(400).json({
                  message:"la contraseña ingresada es incorrecta"
              })
          }
          
      }) 
  }
})
})

app.post("/rooms",( req, res)=>{
    const {userId} = req.body
    //verifica que la collection con el id del usuario existe, si existe crea una sala en la rtdb que va atener el nombre del id del usuario
    //y una propiedad para los mensajes
    //IMPORTANTE convertir el valor de userid a string para que no falle
    usersCollection.doc(userId.toString())
    .get()
    .then(doc => {
        if(doc.exists){
    // al trabajar con la rtdb siempre crear una referencia        
          const roomRef =  RTDB.ref("rooms/"+ nanoid());
          roomRef.set({
            messages:[],
            owner:userId
        }).then(() =>{
    // una vez que creamos la sala en la rtdb creamos el doc dentro de firestore que va  a tener 
    // el id amigable 
            const longId = roomRef.key;
            const roomId = 1000 + Math.floor(Math.random() * 999);
    //IMPORTANTE convertir el id a string        
            roomsCollection.doc(roomId.toString()).set({
                rtdbRoomId:longId
            }).then(()=>{
                res.json({
                    roomId: roomId.toString()
                })
            })
                })
         
            }else{
                res.status(401).json(
                    {message:"el usuario con el que intenta crear la sala no existe"}
                )
            }
        })
    })
    
// para poder obtener el id dinamico que nos pasan como parametro el metodo get
// a diferencia del metodo post que usa el req.body utiliza el req.query
    app.get("/rooms/:roomid",( req, res)=>{

    const {userid} = req.query;
    const {roomid} = req.params
    usersCollection
    .doc(userid.toString())
    .get()
    .then((doc) => {
        if(doc.exists){     
        roomsCollection.doc(roomid)
        .get()
        .then(snap=>{
            const data = snap.data();
            res.json({data})
        })
            }else{
                res.status(401).json(
                    {message:"el usuario con el que intenta crear la sala no existe"}
                )
            }
        })
    })
    app.post("/messages", (req: any, res: any) => {
        console.log(req.body)
        const {from} = req.body
        const {message} = req.body
        const{roomId} = req.body
        //hacemos la referencia a la parte de la rtbd a la que quermos acceder
        const chatRoomRef = RTDB.ref("/rooms/"+roomId+"/messages")
        //hacemos el push del req.boy que trar los datos del state en el front
        chatRoomRef.push({
            from,
            message
        }, function(){
          res.json("funciona")
        })
    })
   

app.listen(port,()=>{
    console.log(`http://localhost:${port}`)
})