import mongoose from "mongoose";
import bcrypt from "bcrypt";


const accountMetaSchema = new mongoose.Schema({
    isVerified: {
        type: Boolean,
        default: false,
    },

    isPrivate: {
        type: Boolean,
        default: false,
    }
}, { _id: false });

const userschema = new mongoose.Schema(
    {
        fullname: {
            type: String,
            required: [true, "FUll-Name is required"],
        },

        username: {
            type: String,
            required: [true, "Username is required"],
        },

        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
        },

        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: 6,
        },
        refreshToken: {
            type: String,
            default: null
        },
        passwordResetToken: {
            type: String,
        },

        passwordResetExpires: {
            type: Date,
        },
        verified: {
            type: Boolean,
            default: false,
        },
    
        isDeleted: {
            type: Boolean,
            default: false,
        },

        deletedAt: {
            type: Date,
            default: null,
        },

        emailOTP: String,
        otpExpire: Date,
        accountMeta: accountMetaSchema
    }, { timestamps: true });

userschema.pre("save", async function () {
    if (!this.isModified("password")) return;

    this.password = await bcrypt.hash(this.password, 10);
});
userschema.methods.comparePassword = function (enteredPassword) {
    return bcrypt.compare(enteredPassword, this.password);
};
userschema.pre(/^find/, function () {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: false });
  }
});
userschema.query.withDeleted = function () {
  return this.setOptions({ includeDeleted: true });
};

const User = mongoose.model("User", userschema);

const profileSchema = new mongoose.Schema({
    bio: {
        type: String,
        default: "",
        maxlength: 100,
    },

    profilePicture: {
        type: String,
        default: null,
    },

    coverPhoto: {
        type: String,
        default: null,
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Owner is required."],
    },
});

const Profile = mongoose.model("Profile", profileSchema);

const followSchema = new mongoose.Schema(
  {
    follower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    following: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

followSchema.index({ follower: 1, following: 1 }, { unique: true });

 const Follow = mongoose.model("Follow", followSchema);

 export { User, Profile, Follow };
