const app = require('./src/app');

const PORT = process.env.PORT || 3000;
const connectToDB = require('./src/config/db');

connectToDB();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

