import React, {useState, useEffect, createContext} from 'react'
import mockUser from './mockData.js/mockUser'
import mockRepos from './mockData.js/mockRepos'
import mockFollowers from './mockData.js/mockFollowers'
import axios from 'axios'

const rootUrl = 'https://api.github.com'

const GithubContext = createContext()

const GithubProvider = ({children}) => {
    const [githubUser, setGithubUser] = useState(mockUser)
    const [repos, setRepos] = useState(mockRepos)
    const [followers, setFollowers] = useState(mockFollowers)

    const [requests, setRequest] = useState(0)
    const [loading, setLoading] = useState(false)

    const [error, setError] = useState({show: false, msg: ''})

    const searchGithubUser = async (user) => {
        // toggleError
        setLoading(true)
        toggleError(false)
        const response = await axios(`${rootUrl}/users/${user}`)
            .catch(err => console.log(err))
        if (response) {
            setGithubUser(response.data)
            const {login, followers_url} = response.data
            // get a user's repos
            // axios(`${rootUrl}/users/${login}/repos?per_page=100`)
            //     .then(response => setRepos(response.data))
            //
            // // get user's followers
            // axios(`${followers_url}?per_page=100`)
            //     .then(response => setFollowers(response.data))
            await Promise.allSettled([
                axios(`${rootUrl}/users/${login}/repos?per_page=100`),
                axios(`${followers_url}?per_page=100`)
            ]).then(results => {
                const [repos, followers] = results
                const status = 'fulfilled';
                if (repos.status === status) {
                    setRepos(repos.value.data)
                }
                if (followers.status === status) {
                    setFollowers(repos.value.data)
                }
            }).catch(err => console.log(err))
        } else {
            toggleError(true, 'There is no user with that username!')
        }
        checkRequests()
        setLoading(false)
    }

    // check rate
    const checkRequests = () => {
        axios(`${rootUrl}/rate_limit`).then(({data}) => {
            console.log(data)
            let {rate: {remaining}} = data
            setRequest(remaining)
            if (remaining === 0) {
                // throw an error
                toggleError(true, 'sorry, you have exceeded your hourly rate limit!')
            }
        }).catch(err => console.log(err))
    }

    function toggleError(show = false, msg = '') {
        setError({show, msg})
    }

    useEffect(checkRequests, [])

    return <GithubContext.Provider
        value={{
            githubUser,
            repos,
            followers,
            requests,
            error,
            searchGithubUser,
            loading
        }}>{children}</GithubContext.Provider>
}

export {GithubProvider, GithubContext}
