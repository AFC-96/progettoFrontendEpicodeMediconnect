// src/pages/Register.jsx
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { registerThunk } from "../store/authSlice";

const schema = yup.object().shape({
  name: yup.string().required("Full name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup.string().min(6, "Password must be at least 6 characters").required("Password is required")
});

const Register = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
    resolver: yupResolver(schema)
  });

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const onSubmit = async (data) => {
    try {
      const resultAction = await dispatch(registerThunk(data));
      if (registerThunk.fulfilled.match(resultAction)) {
        reset();
        setTimeout(() => navigate("/login"), 3000);
      } else {
        alert(resultAction.payload || "Registration failed");
      }
    } catch (e) {
      console.error(e);
      alert("Unexpected error");
    }
  };

  return (
    <div className="container">
      <div className="form-container">
        <h2 className="form-title">Register as Patient</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input type="text" className="form-input" {...register("name")} />
            {errors.name && <p className="error-text">{errors.name.message}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" {...register("email")} />
            {errors.email && <p className="error-text">{errors.email.message}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="form-input" {...register("password")} />
            {errors.password && <p className="error-text">{errors.password.message}</p>}
          </div>
          <button type="submit" className="form-btn" disabled={isSubmitting}>
            {isSubmitting ? "Registering..." : "Register as Patient"}
          </button>
        </form>
        <div className="form-link">
          <p>Already have an account? <Link to="/login">Login here</Link></p>
          <p className="mt-1">Want to register as a doctor? <Link to="/register-doctor">Click here</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;