const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ca5xplp.mongodb.net/?retryWrites=true&w=majority`;

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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const toyCollection = client.db("toyCollection").collection("toys");
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
    const indexKeys = { name: 1 };
    const indexOptions = { name: "nameIndex" };

    const result = await toyCollection.createIndex(indexKeys, indexOptions);
    console.log(result);
    app.get("/searchToy/:text", async (req, res) => {
      const text = req.params.text;
      const result = await toyCollection
        .find({ name: { $regex: text, $options: "i" } })
        .toArray();
      res.send(result);
    });

    app.get("/toys", async (req, res) => {
      const cursor = toyCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/toys/:category", async (req, res) => {
      const category = req.params.category;
      const query = { category: category };
      const cursor = toyCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/toy/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await toyCollection.findOne(query);
      res.send(result);
    });
    app.post("/post-toy", async (req, res) => {
      const body = req.body;
      console.log(body);
      const result = await toyCollection.insertOne(body);
      if (result?.insertedId) {
        return res.status(200).send(result);
      } else {
        return res.status(404).send({
          message: "can not insert try again leter",
          status: false,
        });
      }
    });
    app.get("/myToys/:email", async (req, res) => {
      console.log(req.params.email);
      const toys = await toyCollection
        .find({
          email: req.params.email,
        })
        .toArray();
      res.send(toys);
    });
    app.get("/myToys/:email/sortByPrice/:sortOrder", async (req, res) => {
      const email = req.params.email;
      const sortOrder = req.params.sortOrder === "desc" ? -1 : 1;

      try {
        const toys = await toyCollection
          .find({ email })
          .sort({ price: sortOrder })
          .toArray();
        res.send(toys);
      } catch (error) {
        console.error("Error fetching sorted toys:", error);
        res.status(500).send("An error occurred while fetching sorted toys.");
      }
    });

    app.patch("/updateToy/:id", async (req, res) => {
      const id = req.params.id;
      const body = req.body;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          price: body.price,
          quantity: body.quantity,
          description: body.description,
        },
      };
      const result = await toyCollection.updateOne(query, updateDoc);
      res.status(200).send(result);
    });
    app.delete("/deleteToy/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await toyCollection.deleteOne(query);
      res.send(result);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Toy House API is running");
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
