require('dotenv').config()
const {ApolloServer, gql} = require('apollo-server')

const mongoose = require('mongoose')
const Author = require('./models/author')
const Book = require("./models/book")

const MONGODB_URI = process.env.MONGO_URL

console.log('connecting to', MONGODB_URI)

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true })
    .then(() => {
        console.log('connected to MongoDB')
    })
    .catch((error) => {
        console.log('error connection to MongoDB:', error.message)
    })


const typeDefs = gql`
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
  }
`

const resolvers = {
    Query: {
        bookCount: () => Book.collection.countDocuments(),
        authorCount: () => Author.collection.countDocuments(),
        allBooks: (root, args) => {
            return Book.find({})
        },
        allAuthors: (root, args) => {
            return Author.find({})
        }
    },
    Mutation: {
        addBook: async (root, args) => {
            let author = await Author.findOne({name: args.author})
            if (!author) {
                author = new Author({ name: args.author})
                author = await author.save()
            }
            const book = new Book({...args, author: author._id})
            return book.save()
        },
        editAuthor: (root, args) => {
            return null
        }
    }
}

const server = new ApolloServer({
    typeDefs,
    resolvers,
})

server.listen().then(({url}) => {
    console.log(`Server ready at ${url}`)
})