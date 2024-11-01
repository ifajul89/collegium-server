const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://collegiumAdmin:${process.env.DB_PASSWORD}@bluebirddb.qlnhkpa.mongodb.net/?retryWrites=true&w=majority&appName=BlueBirdDB`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const collegesCollection = client.db("collegiumDB").collection("colleges");
    const admissionsCollection = client
      .db("collegiumDB")
      .collection("admissions");

    // Define the /colleges endpoint
    app.get("/colleges", async (req, res) => {
      try {
        const result = await collegesCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching colleges:", error);
        res.status(500).send("Error fetching colleges");
      }
    });

    app.get("/colleges/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await collegesCollection.findOne(query);
      res.send(result);
    });

    app.get("/admission/:id", async (req, res) => {
      try {
        const id = req.params.id; // Extract the id from the URL parameters
        const query = { candidateId: id }; // Query to find the admission by candidateId
        const result = await admissionsCollection.findOne(query);
    
        if (!result) {
          return res.status(404).json({ message: "Admission not found" });
        }
    
        res.status(200).json(result); // Send the admission data as JSON
      } catch (error) {
        console.error("Error fetching admission data:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    app.post("/admissions", async (req, res) => {
      const admissionData = req.body;
      const { candidateId } = admissionData;

      try {
        // Check if a candidate with the same ID already exists
        const existingStudent = await admissionsCollection.findOne({
          candidateId: candidateId,
        });

        if (existingStudent) {
          // Send a 409 Conflict status if the candidateId already exists
          return res.status(409).json({ message: "Student already admitted" });
        }

        // If no existing record is found, insert the new admission data
        const result = await admissionsCollection.insertOne(admissionData);

        // Send success response with status 201 (Created)
        res.status(201).json({
          message: "Admission data saved successfully",
          id: result.insertedId,
        });
      } catch (error) {
        console.error("Error processing admission:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

// Call the run function to connect to MongoDB
run().catch(console.dir);

// Define the root endpoint
app.get("/", (req, res) => {
  res.send("Server is running");
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on Port ${port}`);
});

// Close the MongoDB client when the application is shutting down
process.on("SIGINT", async () => {
  await client.close();
  console.log("MongoDB client closed.");
  process.exit(0);
});
