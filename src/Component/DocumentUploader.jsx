import { useState } from "react"; // Importing React's useState hook for managing state
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"; // Firebase storage functions for file uploads
import { collection, addDoc } from "firebase/firestore"; // Firebase Firestore for saving file metadata
import { storage, db } from "../../firebase.config"; // Importing Firebase configuration
import toast, { Toaster } from "react-hot-toast"; // Toast notifications for user feedback

const DocumentUploader = () => {
  // State to hold the selected file
  const [file, setFile] = useState(null);
  // State to manage error messages
  const [error, setError] = useState("");
  // State to track the upload progress (percentage)
  const [progress, setProgress] = useState(0);

  // Accepted file types and maximum file size (5MB)
  const types = ["application/pdf", "text/plain"];
  const maxSize = 5 * 1024 * 1024;

  // Handles file selection and validation
  const handleFileChange = (e) => {
    let selectedFile = e.target.files[0];

    // Check if the selected file matches allowed types and size constraints
    if (
      selectedFile &&
      types.includes(selectedFile.type) &&
      selectedFile.size <= maxSize
    ) {
      setFile(selectedFile); // Valid file selected
      setError(""); // Clear any previous error
    } else {
      setFile(null); // Invalid file, reset file state
      setError("Please select a valid file (PDF or Text file) under 5MB"); // Set error message
      toast.error("Invalid file type or size. Please try again."); // Display error toast
    }
  };

  // Handles the upload process
  const handleUpload = () => {
    if (!file) {
      setError("No file selected"); // Show error if no file is selected
      toast.error("No file selected. Please choose a file."); // Display error toast
      return;
    }

    // Reference to the storage location in Firebase
    const storageRef = ref(storage, `documents/${file.name}`);
    // Upload task with progress tracking
    const uploadTask = uploadBytesResumable(storageRef, file);

    // Monitoring the upload progress
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        // Calculate and update the progress percentage
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(progress); // Update progress state
      },
      (error) => {
        setError(error.message); // Capture any errors during upload
        toast.error(`Upload failed: ${error.message}`); // Display error toast
      },
      async () => {
        // On successful upload, get the download URL of the file
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        setProgress(0); // Reset progress
        toast.success("File uploaded successfully!"); // Show success toast

        // Save the file's download URL and name to Firestore
        await addDoc(collection(db, "documents"), { url, name: file.name });
      }
    );
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h4 className="text-3xl font-bold mb-6 text-center text-gray-800">
          Upload Your Document
        </h4>

        {/* File input for selecting the document */}
        <input
          type="file"
          className="block w-full mb-4 p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          onChange={handleFileChange} // Handle file selection
        />

        {/* Display error message if any */}
        {error && <p className="text-red-600 mb-4 text-sm">{error}</p>}

        {/* Display progress bar during upload */}
        {progress > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
            <div
              className="bg-green-500 h-4 rounded-full text-xs text-white text-center flex items-center justify-center"
              style={{ width: `${progress}%` }} // Dynamically set the progress bar width
            >
              {Math.round(progress)}% {/* Show percentage text */}
            </div>
          </div>
        )}

        {/* Upload button, disabled if no file is selected */}
        <button
          className={`w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold py-3 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-md ${
            !file && "opacity-50 cursor-not-allowed" // Disable button if no file
          }`}
          onClick={handleUpload} // Trigger upload on click
          disabled={!file} // Disable button when no file is selected
        >
          Upload
        </button>

        {/* Toast notifications for feedback */}
        <Toaster position="top-center" reverseOrder={false} />
      </div>
    </div>
  );
};

export default DocumentUploader;
