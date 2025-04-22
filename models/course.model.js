import mongoose from "mongoose";
const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please enter a course title"],
      trim: true,
      maxLength: [100, "Course title must be less than 100 characters"],
    },
    subtitle: {
      type: String,
      trim: true,
      maxLength: [200, "Course Subtitle must be less than 100 characters"],
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Please enter a course category"],
      trim: true,
    },
    level: {
      type: String,
      enum: {
        values: ["beginner", "intermediate", "advanced"],
        message: "PLease select a valid level",
      },
      default: "beginner",
    },
    price: {
      type: Number,
      required: [true, "Please enter a course price"],
      min: [0, "Price must be greater than or equal to 0"],
    },
    thumbnail: {
      type: String,
      default: "default-thumbnail.png",
      required: [true, "Please upload a course thumbnail"],
    },
    enrolledStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    lectures: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lecture",
      },
    ],
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Please enter a course instructor"],
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    totalDuration: {
      type: Number,
      default: 0,
    },
    totalLectures: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

courseSchema.virtual("averageRating").get(function () {
  return 0;
});

courseSchema.pre("save", function (next) {
  if (this.lectures) {
    this.totalLectures = this.lectures.length;
  }
  next();
});

export const Course = mongoose.model("Course", courseSchema);
