import React, { useState, useEffect } from 'react'
import {gql, useMutation, useLazyQuery} from '@apollo/client'

const ALL_AUTHORS = gql`
  query{
    allAuthors{
      id
      name
      born
      bookCount
  }
}
`

const UPDATE_BORN = gql`
  mutation updateBorn($name: String!, $born: Int!) {
    editAuthor(
        name: $name
        setBornTo: $born
    ) {
        name
        born
    }
  }
`


const Authors = (props) => {
    const [getResult, result] = useLazyQuery(ALL_AUTHORS)
    const [ updateBorn ] = useMutation(UPDATE_BORN, {
        refetchQueries: [ { query: ALL_AUTHORS } ]
    })
    const [name, setName] = useState("")
    const [born, setBorn] = useState("")
    const [authors, setAuthors] = useState([])
    const [selectedAuthor, setSelectedAuthor] = useState("")

    useEffect(() => getResult(), [])

    useEffect(() => {
        if (result.data) setAuthors(result.data.allAuthors)
    }, [result])

    if (!props.show) return null
    if (result.loading) return <div>loading...</div>

    const handleUpdateBorn = async e => {
        e.preventDefault()
        await updateBorn({variables: {name: authors.filter(author => author.id === selectedAuthor)[0].name, born: parseInt(born)}})
        setName("")
        setBorn("")
        getResult()
    }


    return (
        <div>
            <h2>authors</h2>
            <table>
                <tbody>
                <tr>
                    <th></th>
                    <th>
                        born
                    </th>
                    <th>
                        books
                    </th>
                </tr>
                {authors.map(a =>
                    <tr key={a.name}>
                        <td>{a.name}</td>
                        <td>{a.born}</td>
                        <td>{a.bookCount}</td>
                    </tr>
                )}
                </tbody>
            </table>
            <h2>Set BirthYear</h2>
            <div>
                <select value={selectedAuthor} onChange={e => setSelectedAuthor(e.target.value)}>
                    <option value="" disabled>Select author</option>
                    { authors.map( author => (
                        <option key={author.id} value={author.id}>{author.name}</option>
                    ))}
                </select>
            </div>
            <div>
                <input type="number" placeholder="Born" value={born} onChange={e => setBorn(e.target.value)}/>
            </div>
            <div>
                <button type="button" onClick={handleUpdateBorn}>Update</button>
            </div>
        </div>
    )
}

export default Authors