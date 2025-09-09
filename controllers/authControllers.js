const AuthUser = require("../models/authUser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");
require("dotenv").config();

// ================== Cloudinary & Multer ==================
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "user_profiles",
    allowed_formats: ["jpg", "png", "jpeg"],
    public_id: (req, file) =>
      Date.now() + "-" + file.originalname.replace(/\s+/g, "_"),
  },
});

const upload = multer({ storage });

// ================== Controllers ==================

const get_Welcome = (req, res) => {
  res.render("user/welcome");
};

const get_signout = (req, res) => {
  res.cookie("jwt", "", { maxAge: 1 });
  res.redirect("/");
};

const get_login = (req, res) => {
  res.render("auth/login");
};

const get_signup = (req, res) => {
  res.render("auth/signup");
};

const post_signup = async (req, res) => {
  try {
    const objError = validationResult(req);
    if (!objError.isEmpty()) {
      return res.json({ arrValidationError: objError.errors });
    }

    const isCurrentEmail = await AuthUser.findOne({ email: req.body.email });
    if (isCurrentEmail) {
      return res.json({ existEmail: "Email already exists" });
    }

    const newUser = await AuthUser.create(req.body);

    const token = jwt.sign(
      { id: newUser._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1d" } // أضفت expiresIn هنا
    );

    res.cookie("jwt", token, { httpOnly: true, maxAge: 86400000 });
    res.json({ id: newUser._id });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const post_login = async (req, res) => {
  try {
    const loginUser = await AuthUser.findOne({ email: req.body.email });
    if (!loginUser) {
      return res.json({ notFoundEmail: "Email not found, please signup" });
    }

    const match = await bcrypt.compare(req.body.password, loginUser.password);
    if (!match) {
      return res.json({ passwordError: "Incorrect password" });
    }

    const token = jwt.sign(
      { id: loginUser._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1d" }
    );

    res.cookie("jwt", token, {
      httpOnly: true,
      maxAge: 86400000,
    });

    res.json({ id: loginUser._id });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const profile_image_update = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const decoded = jwt.verify(req.cookies.jwt, process.env.JWT_SECRET_KEY);

    await AuthUser.updateOne(
      { _id: decoded.id },
      { $set: { profileImage: req.file.path } }
    );

    console.log("Uploaded file:", req.file);

    return res.redirect("/home");
  } catch (err) {
    console.error("Error updating profile:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  get_Welcome,
  get_signout,
  get_login,
  get_signup,
  post_signup,
  post_login,
  profile_image_update,
  upload,
};
