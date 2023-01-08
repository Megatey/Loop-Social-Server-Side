const router = require("express").Router()
const Post = require('../models/Post')

//CREATE POST
router.post('/create-post', async (req, res) => {
    try {
        const post = await Post.create({ ...req.body })
        return res.status(201).json({ status: true, msg: 'Post created successfully' })
    } catch (error) {
        console.log(error, 'something occured')
        return res.status(500).json({ msg: 'Internal Error' })
    }
})

//GET CURRENT USER POST
router.get('/user-posts', async (req, res) => {
    const { user: { userId } } = req
    try {
        const posts = Post.findAll({createdBy: userId})
        if(!posts) {
           return res.status(404).json({
                status: false,
                msg: 'You have no posts'
            })
        }

        res.status(200).json({
            status: true,
            msg: 'Success',
            data: posts
        })
    } catch (error) {
        console.log(error, 'something occured')
        return res.status(500).json({ msg: 'Internal Error' })
    }
})

//GET A USER POST
router.get('/:id/user-posts', async (req, res) => {
    const { params: { id: profileId } } = req
    try {
        const posts = Post.findAll({createdBy: profileId})
        if(!posts) {
           return res.status(404).json({
                status: false,
                msg: 'This user have no posts'
            })
        }

        res.status(200).json({
            status: true,
            msg: 'Success',
            data: posts
        })
    } catch (error) {
        console.log(error, 'something occured')
        return res.status(500).json({ msg: 'Internal Error' })
    }
})

//LIKE A POST
router.patch('/:id/like-post', async (req, res) => {
    const { user: { userId }, params: { id: postId } } = req
    try {
        const post = await Post.findById(postId)
        if (!post) {
            return res.status(404).json({
                status: false,
                msg: 'There is no post with the id ', postId
            })
        }
        await post.updateOne({ $push: { likes: userId } })
        return res.status(200).json({
            status: true,
            msg: 'You have successfully like this post.'
        })
    } catch (error) {
        console.log(error, 'something occured')
        return res.status(500).json({ msg: 'Internal Error' })
    }
})

//UNLIKE POST
router.patch('/:id/unlike-post', async (req, res) => {
    const { user: { userId }, params: { id: postId } } = req
    try {
        const post = await Post.findById(postId)
        if (!post) {
            return res.status(404).json({
                status: false,
                msg: 'There is no post with the id ', postId
            })
        }
        await post.updateOne({ $pull: { likes: userId } })
        return res.status(200).json({
            status: true,
            msg: 'You have successfully unlike this post.'
        })
    } catch (error) {
        console.log(error, 'something occured')
        return res.status(500).json({ msg: 'Internal Error' })
    }
})

//CREATE COMMENT ON A POST
router.patch('/:id/leave-comment', async (req, res) => {
    const { user: { userId }, params: { id: postId } } = req
    try {
        const post = await Post.findById(postId)
        if (!post) {
            return res.status(404).json({
                status: false,
                msg: 'There is no post with the id ', postId
            })
        }
        const commentExist = post.comments.map(comment => comment.commentor === userId)
        if (!commentExist.includes(true)) {
            await post.updateOne({ $push: { comments: req.body } });
            return res.status(200).json({
                status: true,
                msg: 'You have successfully leave a comment on this post.'
            })
        } else {
           return res.status(403).json({
                status: false,
                msg: 'Already commented on this post'
            })
        }

    } catch (error) {
        console.log(error, 'something occured')
     return res.status(500).json({ msg: 'Internal Error' })
    }
})

//DELETE COMMENT
router.patch('/:id/delete-comment', async (req, res) => {
    const { user: { userId }, params: { id: postId } } = req
    try {
        const post = await Post.findById(postId)
        if (!post) {
            return res.status(404).json({
                status: false,
                msg: 'There is no post with the id ', postId
            })
        }
        const commentExist = post.comments.map(comment => comment.commentor === userId)
        if (commentExist.includes(true)) {
            await post.updateOne({ $pull: { comments: { commentor: userId } } }, { safe: true, multi: false })
            return res.status(200).json({
                status: true,
                msg: 'You have successfully delete your comment on this post.'
            })
        } else {
            return res.status(403).json({
                status: false,
                msg: 'You have no comment on this post'
            })
        }

    } catch (error) {
        console.log(error, 'something occured')
        return res.status(500).json({ msg: 'Internal Error' })
    }
})


//USER DELETE OWN POST

router.delete('/:id', async (req, res) => {
    const { user: { userId }, params: { id: postId } } = req
    try {
        const post = await Post.findByIdAndRemove({ _id: postId, createdBy: userId })
        if (!post) {
            return res.status(404).json({
                status: false,
                message: `No post with id ${postId}`
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


module.exports = router
