import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import mysql from 'mysql2';
import axios from 'axios';

dotenv.config();
const app = express();

app.use(bodyParser.json());


const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
}


  

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
})


app.post('/api/linesend', (req, res) => {
    const connection = mysql.createConnection(dbConfig);

    const roomId = req.body.roomId;
    const roomPassword = req.body.roomPassword;
    const roomContent = req.body.roomContent;
  
    connection.query('SELECT line_token FROM tb_line_manage WHERE room_Id = ? AND room_password = ?', [roomId, roomPassword], async (err, result) => {
      if (err) {
        res.status(500).send('Internal Server Error');
        return;
      }
      if (result.length > 0) {
        const lineToken = result[0].line_token;
        
        try {
          await sendLineNotification(roomContent, lineToken);
          res.status(200).json({ "status": "Success", "content": roomContent });
  
        } catch (error) {
          if (error.response && error.response.data) {
            res.status(400).send(`Error sending Line notification: ${error.response.data.message}`);

          } else {
            res.status(500).send('Internal Server Error');
          }
        } finally {
          connection.end(); // Close the MySQL connection
          // console.log("Connection closed");
        }
      } else {
        res.status(400).json({ "status": "fail auth", "message": 'RoomID and Password Invalid.' });
        connection.end(); // Close the MySQL connection
        // console.log("Connection closed");
      }
    });

 

  });
  
  async function sendLineNotification(roomContent, lineToken) {
    await axios.post(
      'https://notify-api.line.me/api/notify',
      { message: roomContent },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Bearer ${lineToken}`,
        },
      }
    );
  }




