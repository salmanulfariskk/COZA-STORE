
const mbnInput = document.getElementById("mbn");
const usernameInput = document.getElementById("name");
const lastname = document.getElementById("lastname");
const lastNameError = document.getElementById("lastNameError");
const nameErrorMessage = document.getElementById("nameErrorMessgae");
const mbnErrorMessage = document.getElementById("mbnErrorMessage");
const emailErrorMessage = document.getElementById("emailErrorMessage");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const passwordErrorMessage = document.getElementById("passwordError");
const confirmPasswordInput = document.getElementById("conformpassword");
const confirmPasswordErrorMessage = document.getElementById("conformpasswordErrorMessage");
const myForm = document.getElementById("myForm")

function validateNameLast() {
    const name = lastname.value.trim();
    
    if (name === "") {
        lastNameError.textContent = "Last name is required";
        return false;
    } else if (name.length < 4) {
        lastNameError.textContent = "Last name must be at least 4 characters";
        return false;
    } else if (/^\d+$/.test(name)) {
        lastNameError.textContent = "Last name cannot be all numbers";
        return false;
    } else {
        lastNameError.textContent = "";
        return true;
    }
}

function validateMobile() {
    const mobileNumber = mbnInput.value.trim();
    const zeroCount = (mobileNumber.match(/0/g) || []).length;
    const mobileNumberPattern = /^\d+$/;
    if(mobileNumber === ""){
        mbnErrorMessage.textContent = "Mobile number required";

        return false
    }
    if (!mobileNumberPattern.test(mobileNumber)) {
        mbnErrorMessage.textContent = "Invalid mobile number. Please enter numbers only.";
        return false;
    } else if (zeroCount > 5) {
        mbnErrorMessage.textContent = "Too many zeros in the mobile number.";
        return false;
    } else {
        mbnErrorMessage.textContent = "";
        return true;
    }
}

function validateName() {
    const name = usernameInput.value.trim();
    
    if (name === "") {
        nameErrorMessage.textContent = "First name  is required";
        return false;
    }else if (/^\d+$/.test(name)) {
        nameErrorMessage.textContent = "First name  cannot be all numbers";
        return false;
    } else {
        nameErrorMessage.textContent = "";
        return true;
    }
}

function validateEmail() {
    const email = emailInput.value.trim();
    if(email === ""){
        emailErrorMessage.textContent = "Email required";

        return false
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
        emailErrorMessage.textContent = "Please enter a valid email address.";
        return false;
    } else {
        emailErrorMessage.textContent = "";
        return true;
    }
}

function validatePassword() {
    const password = passwordInput.value;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*()_+[\]{}|\\:;'"<>,.?/~`]/.test(password);
    if(password === ""){
        passwordErrorMessage.textContent = "Password is required.";
        return false;
    }
    if (password.length < 8) {
        passwordErrorMessage.textContent = "Password must have at least 8 characters";
        return false;
    } else if (!(hasUppercase && hasLowercase && hasNumbers && hasSpecialChars)) {
        passwordErrorMessage.textContent = "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character"
        return false;
    } else {
        passwordErrorMessage.textContent = "";
        return true;
    }
}

function validateConfirmPassword() {
    const confirmPassword = confirmPasswordInput.value;
    const originalPassword = passwordInput.value;
    if (confirmPassword === "") {
        confirmPasswordErrorMessage.textContent = " Confirm Password is required";
        return false;
    }
    if (confirmPassword !== originalPassword) {
        confirmPasswordErrorMessage.textContent = "The passwords do not match";
        return false;
    } else {
        confirmPasswordErrorMessage.textContent = "";
        return true;
    }
}

myForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const isMobileValid = validateMobile();
    const isNameValid = validateName();
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    const isConfirmPasswordValid = validateConfirmPassword();
    const validateNameL = validateNameLast();


    if (isMobileValid && isNameValid && isEmailValid && isPasswordValid && isConfirmPasswordValid && validateNameL) {
      
            // Proceed with form submission
            myForm.submit();
       
    } 
    
});
const passwordInp = document.getElementById('password');
const showPasswordCheckbox = document.getElementById('showPasswordCheckbox');
showPasswordCheckbox.addEventListener('change', () => {
    passwordInp.type = showPasswordCheckbox.checked ? 'text' : 'password';
});