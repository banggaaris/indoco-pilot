flowchart TD
    Start[Start]
    Landing[Landing Page]
    SignIn[Sign In Page]
    SignUp[Sign Up Page]
    APIAuth[Auth API]
    Decision{Auth Successful}
    Dashboard[Dashboard]
    Error[Auth Failed]
    Logout[Logout]

    Start --> Landing
    Landing --> SignIn
    Landing --> SignUp
    SignIn --> APIAuth
    SignUp --> APIAuth
    APIAuth --> Decision
    Decision -->|Yes| Dashboard
    Decision -->|No| Error
    Error --> SignIn
    Dashboard --> Logout
    Logout --> Landing