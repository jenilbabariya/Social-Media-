import { User, Profile } from "../models/user.model.js";
import Post from "../models/post.model.js";
import Like from "../models/like.model.js";
import { errorResponse } from "../lib/general.js";

export const renderLogin = (req, res) => {
  return res.render("login.ejs", {
    header: {
      title: "Login | SocialMedia",
      desc: "",
      css: [],
      js: []
    },
    body: {},
    footer: {
      js: []
    }
  });
};

export const renderRegister = (req, res) => {
  return res.render("register.ejs", {
    header: {
      title: "Register | SocialMedia",
      desc: "",
      css: [],
      js: []
    },
    body: {},
    footer: {
      js: []
    }
  });
};

export const renderdashboard = async (req, res) => {

  try {
    const user = await User.findById(req.user._id);

    res.render("dashboard.ejs", {

      header: {
        title: "Dashboard | SocialMedia"
      },

      body: {
        user
      },

      footer: {
        js: []
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json(errorResponse("Server error"));
  }
};
export const renderForgotPassword = (req, res) => {
  try {
    res.render("forgot-password.ejs", {

      header: {
        title: "Forgot Password | SocialMedia"
      },

      body: {

      },

      footer: {
        js: []
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json(errorResponse("Server error"));
  }
};
export const renderResetPassword = (req, res) => {
  try {
    const { token } = req.params
    res.render("reset-password.ejs", {

      header: {
        title: "Reset Password | SocialMedia"
      },

      body: {
        token
      },

      footer: {
        js: []
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json(errorResponse("Server error"));
  }
};

export const renderVerifyPage = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) return res.redirect("/register");

    if (user.verified) return res.redirect("/login");

    res.render("verify-otp.ejs", {

      header: {
        title: "Verify Email | SocialMedia"
      },

      body: {
        userId: user._id,
      },

      footer: {
        js: []
      }
    });
  }
  catch (err) {
    console.error(err);
    res.status(500).json(errorResponse("Server error"));
  }
};

export const renderCreatePost = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.render("create-post.ejs", {
      header: {
        title: "Create Post | SocialMedia",
        css: []
      },
      body: {
        user
      },
      footer: {
        js: ["create-post"]
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json(errorResponse("Server error"));
  }
};

export const renderEditPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findOne({ _id: postId, user: req.user._id }).lean();

    if (!post) {
      return res.redirect("/dashboard");
    }

    res.render("create-post.ejs", {
      header: {
        title: "Edit Post | SocialMedia",
        css: []
      },
      body: {
        user: req.user,
        post
      },
      footer: {
        js: ["create-post"]
      }
    });
  } catch (err) {
    console.error(err);
    res.redirect("/dashboard");
  }
};

export const renderSinglePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId).populate("user", "username fullname").lean();

    if (!post) {
      return res.redirect("/dashboard");
    }

    // Fetch profile picture
    const profile = await Profile.findOne({ userId: post.user._id }, "profilePicture");
    if (profile && profile.profilePicture) {
      post.user.profilePicture = profile.profilePicture;
    }

    let isLiked = false;
    if (req.user) {
      const userLike = await Like.findOne({ user: req.user._id, post: postId });
      if (userLike) {
        isLiked = true;
      }
    }

    post.isLiked = isLiked;

    res.render("single-post.ejs", {
      header: {
        title: `Post by @${post.user.username} | SocialMedia`,
        css: ["single-post"]
      },
      body: {
        post,
        currentUser: req.user
      },
      footer: {
        js: ["single-post"]
      }
    });

  } catch (err) {
    console.error(err);
    res.redirect("/dashboard");
  }
};

export const renderSearchPage = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.render("search.ejs", {
      header: {
        title: "Search | SocialMedia",
        css: ["search"]
      },
      body: {
        user
      },
      footer: {
        js: ["search"]
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json(errorResponse("Server error"));
  }
};


