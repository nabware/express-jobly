# Jobly Backend

Jobly is a full stack web application of a mock job board site where users can create an account and login. Logged in users can browse through a list of companies and/or jobs with the ability to filter the list using the search bar. Each company has a list of job openings that a user can view and/or apply to. 

# Table of Contents
1. [Features](#Features)
2. [Tech stack](#Tech-stack)
3. [Install](#Install)
4. [Deployment](#Deployment)

## Features<a name="Features"></a>
* Utilizes RESTful API
* Users must create an account to access the application. Passwords are hashed and authenticated using bcrypt. 
* Users can browse through library of companies and/or jobs with the option to filter using the search bar. 
* Users can update their profile.

## Tech stack<a name="Tech-stack"></a>

### Backend
![alt text](https://img.shields.io/badge/-Express-000000?logo=express&logoColor=white&style=for-the-badge)
![alt text](https://img.shields.io/badge/-Node.js-339933?logo=node.js&logoColor=white&style=for-the-badge)
![alt text](https://img.shields.io/badge/-PostgresSQL-4169E1?logo=postgresql&logoColor=white&style=for-the-badge)

### Frontend ([GitHub Repo](https://github.com/nabware/react-jobly))
![alt text](https://img.shields.io/badge/-ReactJs-61DAFB?logo=react&logoColor=white&style=for-the-badge)

## Install<a name="Install"></a>
To set up and load the database: 

    createdb jobly < jobly.sql

This project uses Node.js for the back-end JavaScript runtime environment. To install the backend dependencies from the package.json file:
    
    npm install

To start the sever (port 3001):

    npm start

## Deployment<a name="Deployment"></a>
### Backend Deployment
We used ElephantSQL and Render to deploy our backend.

In ElephantSQL, create a 'Tiny Turtle' instance and copy the URL of your new instance.

Seed your database: 

    pg_dump -O jobly | psql (url you copied here)

In Render, create a new instance of “Web service”. 

Connect to your repository and give your instance a name, which must be globally unique.

Choose advanced, and enter environmental variables:

    DATABASE_URL: URL from ElephantSQL
    
    SECRET_KEY: anything you want
    
Lastly select 'Create Web Service'
