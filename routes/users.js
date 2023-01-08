const router = require("express").Router()
const User = require("../models/User")
const bcrypt = require('bcryptjs')



//UPDATE USER PROFILE
router.patch('/update-profile', async (req, res) => {
    const { user: { userId }, body } = req
    try {
        if (Object.values(body).some(o => o === null || '')) {
            return res.status(400).json({
                status: false,
                meassage: 'No filled should be empty.'
            })
        }
        if (req.body.password) {
            try {
                const salt = await bcrypt.genSalt(10)
                req.body.password = await bcrypt.hash(req.body.password, salt)
            } catch (err) {
                console.log(err, 'Unable to decrypt password')
                return res.status(500).json({
                    msg: 'Unable to decrypt password',
                    err
                })
            }
        }
        const user = await User.findByIdAndUpdate({ _id: userId }, req.body, { new: true, runValidators: true })
        if (!user) {
            return res.status(404).json({
                status: false,
                message: `No user with id ${userId}`
            })
        }
        res.status(200).json({
            status: true,
            message: 'Update Successfully',
            data: user,
        })
    } catch (error) {
        console.log(error, 'something occured')
        res.status(500).json({ msg: 'Internal Error' })
    }
})

//DELETE USER ACCOUNT
router.delete('/delete-account', async (req, res) => {
    const { user: { userId } } = req
    try {
        const user = await User.findByIdAndRemove({ _id: userId })
        if (!user) {
            return res.status(404).json({
                status: false,
                message: `No user with id ${userId}`
            })
        }
        return res.status(200).json({
            status: true,
            message: 'Deleted Successfully'
        })
    } catch (error) {
        console.log(error, 'something occured')
        return res.status(500).json({ msg: 'Internal Error' })
    }
})

//GET A USER (This endpoint is used for checking a another user profile)

router.get('/:id', async (req, res) => {
    const { params: { id: profileId } } = req
    try {
        const user = await User.findOne({ _id: profileId }).select('username email profilePicture coverPicture followers followings desc city from relationship')
        if (!user) {
            return res.status(404).json({
                status: false,
                message: `No user with id ${profileId}`
            })
        }

        return res.status(200).json({
            status: true,
            data: user,
        })
    } catch (error) {
        console.log(error, 'something occured')
        return res.status(500).json({ msg: 'Internal Error' })
    }
})

//GET OWN CURRENT USER

router.get('/', async (req, res) => {
    const { user: { userId } } = req
    try {
        const user = await User.findOne({ _id: userId }).select('username email profilePicture coverPicture followers followings desc city from relationship')
        if (!user) {
            return res.status(404).json({
                status: false,
                message: `No user with id ${profileId}`
            })
        }

        return res.status(200).json({
            status: true,
            data: user,
        })
    } catch (error) {
        console.log(error, 'something occured')
        return res.status(500).json({ msg: 'Internal Error' })
    }
})

//FOLLOW A USER

router.patch('/:id/follow', async (req, res) => {
    const { user: { userId }, params: { id: profileId } } = req

    if (userId !== profileId) {
        try {
            const user = await User.findById(profileId)
            const currentUser = await User.findById(userId)
            if(!user.followers.includes(userId)){
                await user.updateOne({ $push: { followers: userId } })
                await currentUser.updateOne({ $push: { followings: profileId}})
                res.status(200).json({
                    status: true,
                    msg: 'You are now following this user'
                })
            } else {
                res.status(403).json({
                    status: false,
                    msg: 'You have already follow this user'
                })
            }
        } catch (error) {
            console.log(error)
            res.status(500).json({
                status: false,
                error: error,
                msg: 'Server Error'
            })
        }
    } else {
        res.status(403).json({
            status: false,
            msg: 'You cannot follow yourself'
        })
    }

})

//UNFOLLOW USER
router.patch('/:id/unfollow', async (req, res) => {
    const { user: { userId }, params: { id: profileId } } = req

    if (userId !== profileId) {
        try {
            const user = await User.findById(profileId)
            const currentUser = await User.findById(userId)
            if(user.followers.includes(userId) || currentUser.followings.includes(profileId)){
                await user.updateOne({ $pull: { followers: userId } })
                await currentUser.updateOne({ $pull: { followings: profileId}})
                res.status(200).json({
                    status: true,
                    msg: 'You have successfully unfollow this user'
                })
            } else {
                res.status(403).json({
                    status: false,
                    msg: 'You dont follow this user'
                })
            }
        } catch (error) {
            console.log(error)
            res.status(500).json({
                status: false,
                error: error,
                msg: 'Server Error'
            })
        }
    } else {
        res.status(403).json({
            status: false,
            msg: 'You cannot follow yourself'
        })
    }

})



module.exports = router