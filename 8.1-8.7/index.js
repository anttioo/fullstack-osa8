require('dotenv').config()
const {ApolloServer, gql, UserInputError} = require('apollo-server')

const mongoose = require('mongoose')
const Author = require('./models/author')
const Book = require("./models/book")
const User = require("./models/user")
const jwt = require("jsonwebtoken");
const {AuthenticationError} = require("apollo-server");

const MONGODB_URI = process.env.MONGO_URL
const JWT_SECRET = 'SECRET'

console.log('connecting to', MONGODB_URI)

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true })
    .then(() => {
        console.log('connected to MongoDB')
    })
    .catch((error) => {
        console.log('error connection to MongoDB:', error.message)
    })


const typeDefs = gql`
  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }

  type Token {
    value: String!
  }

  type Book {
    title: String!
    published: Int!
    author: Author!
    id: ID!
    genres: [String]!
  }
  
  type Author {
    name: String!
    id: ID!
    born: Int
    books: [Book]
    bookCount: Int
  }
  
  type Query {
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genre: String): [Book!]!
    allAuthors: [Author!]!
    me: User
  }
  
  type Mutation {
    addBook(
        title: String!
        author: String!
        published: Int!
        genres: [String!]!
    ): Book
    editAuthor(
        name: String!
        setBornTo: Int!
    ): Author
    createUser(
      username: String!
      favoriteGenre: String!
    ): User
    login(
      username: String!
      password: String!
    ): Token
  }
`

const resolvers = {
    Query: {
        bookCount: () => Book.collection.countDocuments(),
        authorCount: () => Author.collection.countDocuments(),
        allBooks: (root, args) => {
            const findProps = {}
            if (args.genre) findProps.genres = { $in: [args.genre] }
            return Book.find(findProps)
        },
        allAuthors: (root, args) => {
            return Author.find({})
        },
        me: (root, args, context) => {
            return context.currentUser
        }
    },
    Mutation: {
        addBook: async (root, args,  { currentUser }) => {
            if (!currentUser) throw new AuthenticationError("not authenticated")
            let author = await Author.findOne({name: args.author})
            if (!author) {
                author = new Author({ name: args.author})
                try {
                    await author.save()
                } catch (error) {
                    throw new UserInputError(error.message, {
                        invalidArgs: args,
                    })
                }
            }
            const book = new Book({...args, author: author._id})
            try {
                await book.save()
            } catch (error) {
                throw new UserInputError(error.message, {
                    invalidArgs: args,
                })
            }
            return book
        },
        editAuthor: async (root, args,  { currentUser }) => {
            if (!currentUser) throw new AuthenticationError("not authenticated")
            const author = await Author.findOne({name: args.name})
            author.born = args.setBornTo
            return author.save()
        },
        createUser: async (root, args) => {
            const user = new User({ ...args })
            return user.save()
        },
        login: async (root, args) => {
            const user = await User.findOne({ username: args.username })
            if ( !user || args.password !== 'secret' ) {
                throw new UserInputError("wrong credentials")
            }
            const userForToken = {
                username: user.username,
                id: user._id,
            }
            return { value: jwt.sign(userForToken, JWT_SECRET) }
        },
    }
}

const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({ req }) => {
        const auth = req ? req.headers.authorization : null
        if (auth && auth.toLowerCase().startsWith('bearer ')) {
            const decodedToken = jwt.verify(
                auth.substring(7), JWT_SECRET
            )
            const currentUser = await User.findById(decodedToken.id)
            return { currentUser }
        }
    }
})

server.listen().then(({url}) => {
    console.log(`Server ready at ${url}`)
})