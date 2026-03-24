export const rules = {
  auth: {
    register: {
      username: "required|string|min:3|max:30",
      email: "required|email",
      password: "required|string|min:6",
      confirmPassword: "required|same:password",
      fullname: "required|string|min:3|max:50"
    },

    login: {
      login: "required|string", 
      password: "required|string"
    },

    resetPassword: {
          password:  "required|string|min:6",
          confirmPassword: "required|same:password",
    },

  },

  settings: {
    
    changePassword: {
        currentPassword: "required|string",
        newPassword: "required|string|min:6",
        confirmPassword: "required|same:newPassword"
    }
}
};