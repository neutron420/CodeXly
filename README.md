<div align="center">

# CodeXly

<br/>

<div>
  <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma">
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/shadcn/ui-000000?style=for-the-badge&logo=shadcnui&logoColor=white" alt="shadcn/ui">
  <img src="https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white" alt="Jest">
  <img src="https://img.shields.io/badge/ESLint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white" alt="ESLint">
</div>

<br/>

**A modern, full-stack web application built with Next.js 15, featuring a robust backend with Prisma ORM, comprehensive testing suite, and a beautiful UI powered by shadcn/ui and Tailwind CSS.**

<p>
  <a href="#about-the-project">About</a> •
  <a href="#key-features">Features</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#license">License</a>
</p>

[**Live Demo**](https://www.codexly.xyz/) · [**Report a Bug**](https://github.com/neutron420/CodeXly/issues) · [**Request a Feature**](https://github.com/neutron420/CodeXly/issues)

</div>

## About The Project

CodeXly is a production-ready web application showcasing modern development practices and cutting-edge technologies. Built with Next.js 15 and the App Router, it features a type-safe backend with Prisma ORM, comprehensive API testing with Jest, and a polished user interface designed with shadcn/ui components. The project demonstrates best practices in full-stack development, from database design to deployment automation.

### Built With

This project leverages the latest web technologies for optimal performance and developer experience.

* **Framework:** [Next.js](https://nextjs.org/) 15
* **Language:** [TypeScript](https://www.typescriptlang.org/)
* **UI Library:** [React](https://react.dev/) 19
* **Database ORM:** [Prisma](https://www.prisma.io/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **UI Components:** [shadcn/ui](https://ui.shadcn.com/), [Radix UI](https://www.radix-ui.com/)
* **Testing:** [Jest](https://jestjs.io/)
* **Linting:** [ESLint](https://eslint.org/)
* **Font Optimization:** [Geist Font](https://vercel.com/font)
* **CI/CD:** [GitHub Actions](https://github.com/features/actions)

## Key Features

* **Next.js App Router:** Latest routing architecture with server components and streaming
* **Type-Safe Backend:** Full TypeScript integration with Prisma for database operations
* **Modern UI/UX:** Beautiful, accessible components built with shadcn/ui and Tailwind CSS
* **Comprehensive Testing:** Jest-based test suite for API endpoints and components
* **Database Management:** Prisma ORM with migrations and schema management
* **API Routes:** RESTful API endpoints with proper error handling
* **Font Optimization:** Automatic font optimization with next/font
* **Responsive Design:** Mobile-first approach with Tailwind CSS
* **CI/CD Pipeline:** Automated testing and deployment with GitHub Actions
* **Developer Experience:** Hot reload, TypeScript intellisense, and ESLint integration

## Getting Started

To get a local copy up and running for development, follow these simple steps.

### Prerequisites

You will need Node.js (version 18 or higher) and a package manager (npm, yarn, pnpm, or bun) installed on your system.

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/neutron420/CodeXly.git
    cd CodeXly
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    # or
    yarn install
    # or
    pnpm install
    # or
    bun install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root directory:
    ```env
    DATABASE_URL="your_database_connection_string"
    NEXT_PUBLIC_APP_URL="http://localhost:3000"
    # Add other environment variables as needed
    ```

4.  **Set up the database:**
    ```sh
    # Generate Prisma Client
    npx prisma generate
    
    # Run migrations
    npx prisma migrate dev
    
    # (Optional) Seed the database
    npx prisma db seed
    ```

5.  **Start the development server:**
    ```sh
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    # or
    bun dev
    ```

6.  **Open your browser:**
    Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
codexly/
├── app/                    # Next.js App Router pages and layouts
│   ├── api/               # API route handlers
│   ├── (routes)/          # Application routes
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── ...               # Custom components
├── lib/                   # Utility libraries
│   ├── prisma.ts         # Prisma client instance
│   └── utils.ts          # Helper functions
├── prisma/                # Prisma schema and migrations
│   ├── schema.prisma     # Database schema
│   └── migrations/       # Database migrations
├── hooks/                 # Custom React hooks
├── public/               # Static assets
├── __tests__/            # Test files
│   └── api/             # API endpoint tests
├── .github/workflows/    # GitHub Actions workflows
└── components.json       # shadcn/ui configuration
```

## Available Scripts

### Development

```sh
# Start development server
npm run dev

# Run development server with turbo
npm run dev:turbo
```

### Database

```sh
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Open Prisma Studio (database GUI)
npx prisma studio

# Reset database
npx prisma migrate reset
```

### Testing

```sh
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Build & Production

```sh
# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix
```

## Database Schema

The application uses Prisma ORM for database management. View and modify the schema in `prisma/schema.prisma`.

### Common Prisma Commands

```sh
# Create a new migration
npx prisma migrate dev --name your_migration_name

# Apply migrations to production
npx prisma migrate deploy

# Pull schema from existing database
npx prisma db pull

# Push schema changes without migration
npx prisma db push
```

## API Routes

API endpoints are located in the `app/api` directory. Each route handler follows Next.js App Router conventions.

### Example API Structure

```
app/api/
├── users/
│   ├── route.ts          # GET, POST /api/users
│   └── [id]/
│       └── route.ts      # GET, PUT, DELETE /api/users/:id
└── posts/
    └── route.ts          # GET, POST /api/posts
```

## Testing

The project uses Jest for testing with support for:

* **Unit Tests:** Component and function testing
* **Integration Tests:** API endpoint testing
* **Code Coverage:** Track test coverage metrics

Run tests:
```sh
npm test
```

## Styling

The application uses Tailwind CSS with shadcn/ui components for styling:

* **Tailwind CSS:** Utility-first CSS framework
* **shadcn/ui:** Pre-built, accessible components
* **CSS Variables:** Theme customization with CSS variables
* **Dark Mode:** Built-in dark mode support

## Deployment

### Deploy to Vercel

The easiest way to deploy this Next.js app is using Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/neutron420/CodeXly)

1. **Connect Repository:** Link your GitHub repository to Vercel
2. **Configure Environment Variables:** Add your production environment variables
3. **Deploy:** Vercel automatically builds and deploys your application

Live site: [www.codexly.xyz](https://www.codexly.xyz/)

### Manual Deployment

```sh
# Build the application
npm run build

# Start production server
npm start
```

## Environment Variables

Required environment variables for production:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database"

# Application
NEXT_PUBLIC_APP_URL="https://www.codexly.xyz"

# Authentication (if applicable)
NEXTAUTH_SECRET="your_nextauth_secret"
NEXTAUTH_URL="https://www.codexly.xyz"

# Other services
# Add your service-specific variables here
```

## CI/CD Pipeline

The project includes GitHub Actions workflows for:

* **Continuous Integration:** Run tests and linting on every push
* **Build Verification:** Ensure successful builds
* **Type Checking:** TypeScript compilation checks
* **Automated Deployment:** Deploy to production on main branch

Workflows are located in `.github/workflows/`

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## Development Guidelines

* **Code Style:** Follow the ESLint configuration
* **Type Safety:** Ensure all code is properly typed
* **Testing:** Write tests for new features
* **Documentation:** Update README and inline comments
* **Commits:** Use conventional commit messages

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact

Project Link: [https://github.com/neutron420/CodeXly](https://github.com/neutron420/CodeXly)

Live Site: [https://www.codexly.xyz/](https://www.codexly.xyz/)

## Acknowledgments

* [Next.js Documentation](https://nextjs.org/docs)
* [Prisma Documentation](https://www.prisma.io/docs)
* [shadcn/ui](https://ui.shadcn.com/)
* [Tailwind CSS](https://tailwindcss.com/)
* [Vercel Platform](https://vercel.com/)
* [TypeScript Documentation](https://www.typescriptlang.org/docs/)
