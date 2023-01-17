const router = require("express").Router();
const User = require("../models/User");

//REGISTER USER
router.post("/register", async (req, res) => {
  try {
    const user = await User.create({ ...req.body });
    const token = await user.createJwT();
    res
      .status(201)
      .json({ status: "Success", username: user.name, token, user });
    console.log(user);
} catch (error) {
      console.log(error, "something occured");
    if (e.message.includes("E11000")) {
      return res.status(500).json({
        message: "This Email Already Used try with another email",
        success: false,
      });
    }
    // res.status(500).json({ msg: "Internal Error" });
  }
});

//LOGIN USER
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json("Please Provide email and password");
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ error: true, msg: "Invalid Credentials" });
      return;
    }

    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      res.status(401).json({ error: true, msg: "Invalid Credentials" });
      return;
    }
    const token = await user.createJwT();
    res.status(200).json({ status: "Success", username: user.name, token });
  } catch (error) {
    console.log(error, "something occured");
    res.status(500).json({ msg: "Internal Error" });
  }
});

module.exports = router;
