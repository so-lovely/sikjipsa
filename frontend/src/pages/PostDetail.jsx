import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Card,
  Title,
  Text,
  Button,
  Group,
  Stack,
  Badge,
  Avatar,
  Textarea,
  ActionIcon,
  Alert,
  Center,
  Loader,
  Divider,
  Image,
  SimpleGrid,
  FileInput,
  Select,
  TextInput,
  Box,
  Modal
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconArrowLeft,
  IconHeart,
  IconMessage,
  IconEdit,
  IconTrash,
  IconSend,
  IconPhoto,
  IconAlertCircle,
  IconX
} from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext.jsx';
import { communityAPI } from '../api/community.js';

function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');
  const [editingPost, setEditingPost] = useState(false);
  const [editPostData, setEditPostData] = useState({
    title: '',
    content: '',
    category: ''
  });
  const [editImages, setEditImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [submittingPost, setSubmittingPost] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [opened, { open, close }] = useDisclosure(false);

  useEffect(() => {
    loadPost();
  }, [id]);

  const loadPost = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await communityAPI.getPost(id);
      setPost(response);
      setLikesCount(response.likes_count || 0);
      
      if (isLoggedIn) {
        setLiked(response.is_liked_by_user || false);
      } else {
        setLiked(false);
      }
      
      setComments(response.comments || []);
      
    } catch (error) {
      console.error('게시글 로딩 실패:', error);
      setError('게시글을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!isLoggedIn) {
      alert('좋아요를 누르려면 로그인이 필요합니다.');
      return;
    }

    try {
      const response = await communityAPI.toggleLike(id);
      const newLikedState = response.liked;
      
      setLiked(newLikedState);
      setLikesCount(prev => newLikedState ? prev + 1 : prev - 1);
    } catch (error) {
      console.error('좋아요 처리 실패:', error);
      alert('좋아요 처리에 실패했습니다.');
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    
    if (!isLoggedIn) {
      alert('댓글을 작성하려면 로그인이 필요합니다.');
      return;
    }

    if (!commentText.trim()) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    try {
      setSubmittingComment(true);
      const response = await communityAPI.createComment(id, commentText.trim());
      
      loadPost();
      setCommentText('');
    } catch (error) {
      console.error('댓글 작성 실패:', error);
      alert('댓글 작성에 실패했습니다.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleReplySubmit = async (parentCommentId) => {
    if (!isLoggedIn) {
      alert('답글을 작성하려면 로그인이 필요합니다.');
      return;
    }

    if (!replyText.trim()) {
      alert('답글 내용을 입력해주세요.');
      return;
    }

    try {
      setSubmittingComment(true);
      await communityAPI.createComment(id, replyText.trim(), parentCommentId);
      
      loadPost();
      setReplyText('');
      setReplyingTo(null);
    } catch (error) {
      console.error('답글 작성 실패:', error);
      alert('답글 작성에 실패했습니다.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleEditComment = (commentId, currentContent) => {
    setEditingComment(commentId);
    setEditText(currentContent);
  };

  const handleUpdateComment = async (commentId) => {
    if (!editText.trim()) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    try {
      setSubmittingComment(true);
      await communityAPI.updateComment(id, commentId, editText.trim());
      
      loadPost();
      setEditingComment(null);
      setEditText('');
    } catch (error) {
      console.error('댓글 수정 실패:', error);
      alert('댓글 수정에 실패했습니다.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditText('');
  };

  const handleEditPost = () => {
    const images = parseImages(post.images);
    setEditPostData({
      title: post.title,
      content: post.content,
      category: post.post_type
    });
    setExistingImages(images);
    setEditImages([]);
    setEditingPost(true);
  };

  const handleCancelEditPost = () => {
    setEditingPost(false);
    setEditPostData({ title: '', content: '', category: '' });
    setEditImages([]);
    setExistingImages([]);
  };

  const handleUpdatePost = async (e) => {
    e.preventDefault();
    
    if (!editPostData.title.trim() || !editPostData.content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    try {
      setSubmittingPost(true);
      await communityAPI.updatePost(id, editPostData, editImages, existingImages);
      
      loadPost();
      setEditingPost(false);
      setEditImages([]);
      setExistingImages([]);
      alert('게시글이 성공적으로 수정되었습니다!');
    } catch (error) {
      console.error('게시글 수정 실패:', error);
      alert('게시글 수정에 실패했습니다.');
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('정말로 이 댓글을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await communityAPI.deleteComment(id, commentId);
      
      loadPost();
      
      if (editingComment === commentId) {
        setEditingComment(null);
        setEditText('');
      }
    } catch (error) {
      console.error('댓글 삭제 실패:', error);
      alert('댓글 삭제에 실패했습니다.');
    }
  };

  const handleImageClick = (image) => {
    setSelectedImage(image);
    open();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const parseImages = (imagesData) => {
    if (!imagesData) return [];
    try {
      return typeof imagesData === 'string' ? JSON.parse(imagesData) : imagesData;
    } catch (e) {
      return [];
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      '질문답변': 'blue',
      '자랑하기': 'pink',
      '정보공유': 'green',
      '팁공유': 'orange',
      '추천요청': 'purple'
    };
    return colors[category] || 'gray';
  };

  if (loading) {
    return (
      <Container size="lg" py="xl">
        <Center py="xl">
          <Stack align="center" gap="md">
            <Loader color="green" size="lg" />
            <Text size="lg" fw={600} c="gray.7">
              게시글을 불러오는 중...
            </Text>
          </Stack>
        </Center>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="lg" py="xl">
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="오류가 발생했습니다"
          color="red"
          variant="light"
        >
          <Stack gap="md">
            <Text>{error}</Text>
            <Button
              variant="light"
              color="red"
              onClick={() => navigate('/community')}
            >
              커뮤니티로 돌아가기
            </Button>
          </Stack>
        </Alert>
      </Container>
    );
  }

  if (!post) {
    return (
      <Container size="lg" py="xl">
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="게시글을 찾을 수 없습니다"
          color="orange"
          variant="light"
        >
          <Stack gap="md">
            <Text>게시글이 삭제되었거나 존재하지 않습니다.</Text>
            <Button
              variant="light"
              color="orange"
              onClick={() => navigate('/community')}
            >
              커뮤니티로 돌아가기
            </Button>
          </Stack>
        </Alert>
      </Container>
    );
  }

  const images = parseImages(post.images);

  return (
    <Container size="lg" py="xl">
      <Button
        component={Link}
        to="/community"
        variant="subtle"
        leftSection={<IconArrowLeft size={16} />}
        mb="xl"
        color="gray"
      >
        커뮤니티로 돌아가기
      </Button>

      {editingPost ? (
        <Card shadow="md" radius="lg" p="xl" mb="xl">
          <form onSubmit={handleUpdatePost}>
            <Stack gap="lg">
              <TextInput
                label="제목"
                value={editPostData.title}
                onChange={(e) => setEditPostData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="게시글 제목을 입력하세요"
                disabled={submittingPost}
                required
              />
              
              <Select
                label="카테고리"
                value={editPostData.category}
                onChange={(value) => setEditPostData(prev => ({ ...prev, category: value }))}
                data={[
                  { value: '질문답변', label: '질문답변' },
                  { value: '자랑하기', label: '자랑하기' },
                  { value: '정보공유', label: '정보공유' },
                  { value: '팁공유', label: '팁공유' },
                  { value: '추천요청', label: '추천요청' }
                ]}
                disabled={submittingPost}
                required
              />
              
              <Textarea
                label="내용"
                value={editPostData.content}
                onChange={(e) => setEditPostData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="게시글 내용을 입력하세요"
                minRows={6}
                disabled={submittingPost}
                required
              />

              {existingImages.length > 0 && (
                <Box>
                  <Text size="sm" fw={500} mb="xs">기존 이미지</Text>
                  <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md">
                    {existingImages.map((image, index) => (
                      <Box key={index} pos="relative">
                        <Image
                          src={image}
                          alt={`기존 이미지 ${index + 1}`}
                          radius="md"
                          h={120}
                          style={{ objectFit: 'cover' }}
                        />
                        <ActionIcon
                          color="red"
                          size="sm"
                          radius="xl"
                          variant="filled"
                          style={{ position: 'absolute', top: 4, right: 4 }}
                          onClick={() => setExistingImages(prev => prev.filter((_, i) => i !== index))}
                          disabled={submittingPost}
                        >
                          <IconX size={14} />
                        </ActionIcon>
                      </Box>
                    ))}
                  </SimpleGrid>
                </Box>
              )}

              <FileInput
                label="새 이미지 추가"
                placeholder="이미지를 선택하세요"
                leftSection={<IconPhoto size={16} />}
                multiple
                accept="image/*"
                onChange={(files) => {
                  if (files) {
                    const newImages = Array.from(files).map(file => ({
                      file,
                      preview: URL.createObjectURL(file)
                    }));
                    setEditImages(prev => [...prev, ...newImages]);
                  }
                }}
                disabled={submittingPost}
              />

              {editImages.length > 0 && (
                <Box>
                  <Text size="sm" fw={500} mb="xs">새로운 이미지</Text>
                  <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md">
                    {editImages.map((image, index) => (
                      <Box key={index} pos="relative">
                        <Image
                          src={image.preview}
                          alt={`새 이미지 ${index + 1}`}
                          radius="md"
                          h={120}
                          style={{ objectFit: 'cover' }}
                        />
                        <ActionIcon
                          color="red"
                          size="sm"
                          radius="xl"
                          variant="filled"
                          style={{ position: 'absolute', top: 4, right: 4 }}
                          onClick={() => {
                            const imageToRemove = editImages[index];
                            if (imageToRemove.preview) {
                              URL.revokeObjectURL(imageToRemove.preview);
                            }
                            setEditImages(prev => prev.filter((_, i) => i !== index));
                          }}
                          disabled={submittingPost}
                        >
                          <IconX size={14} />
                        </ActionIcon>
                      </Box>
                    ))}
                  </SimpleGrid>
                </Box>
              )}

              <Group justify="flex-end" gap="md">
                <Button
                  variant="light"
                  color="gray"
                  onClick={handleCancelEditPost}
                  disabled={submittingPost}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  variant="gradient"
                  gradient={{ from: 'green.5', to: 'green.6' }}
                  disabled={submittingPost || !editPostData.title.trim() || !editPostData.content.trim()}
                  loading={submittingPost}
                >
                  수정 완료
                </Button>
              </Group>
            </Stack>
          </form>
        </Card>
      ) : (
        <Card shadow="md" radius="lg" p="xl" mb="xl">
          <Stack gap="lg">
            <Box>
              <Badge
                color={getCategoryColor(post.post_type)}
                variant="light"
                size="sm"
                mb="md"
              >
                {post.post_type}
              </Badge>
              
              <Title order={1} size={32} fw={700} c="gray.8" mb="lg" lh={1.3}>
                {post.title}
              </Title>
              
              <Group justify="space-between" align="center" mb="lg">
                <Group>
                  <Avatar
                    color="green"
                    radius="xl"
                    size="sm"
                  >
                    {post.user?.username?.charAt(0) || '?'}
                  </Avatar>
                  <div>
                    <Text size="sm" fw={500}>
                      {post.user?.username || '알 수 없음'}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {formatDate(post.created_at)}
                    </Text>
                  </div>
                </Group>
                
                {isLoggedIn && user && post.user?.id === user.id && (
                  <Button
                    variant="light"
                    size="xs"
                    leftSection={<IconEdit size={14} />}
                    onClick={handleEditPost}
                  >
                    수정
                  </Button>
                )}
              </Group>
            </Box>

            <Divider />

            <Text size="md" lh={1.8} c="gray.7" style={{ whiteSpace: 'pre-wrap' }}>
              {post.content}
            </Text>

            {images.length > 0 && (
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                {images.map((image, index) => (
                  <Image
                    key={index}
                    src={image}
                    alt={`${post.title} 이미지 ${index + 1}`}
                    radius="md"
                    style={{
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease'
                    }}
                    styles={{
                      root: {
                        '&:hover': {
                          transform: 'scale(1.02)'
                        }
                      }
                    }}
                    onClick={() => handleImageClick(image)}
                  />
                ))}
              </SimpleGrid>
            )}

            <Divider />

            <Group justify="space-between">
              <Button
                variant={liked ? 'filled' : 'light'}
                color="red"
                leftSection={<IconHeart size={16} />}
                onClick={handleLike}
              >
                좋아요 {likesCount}
              </Button>
              
              <Group gap="xs">
                <IconMessage size={16} color="var(--mantine-color-blue-5)" />
                <Text size="sm" c="dimmed">
                  {comments.reduce((total, comment) => total + 1 + (comment.replies?.length || 0), 0)}
                </Text>
              </Group>
            </Group>
          </Stack>
        </Card>
      )}

      {/* Comments Section */}
      <Card shadow="md" radius="lg" p="xl">
        <Stack gap="lg">
          <Title order={3} size="lg" c="gray.8">
            💬 댓글 {comments.reduce((total, comment) => total + 1 + (comment.replies?.length || 0), 0)}개
          </Title>
          
          {isLoggedIn && (
            <form onSubmit={handleCommentSubmit}>
              <Stack gap="md">
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="댓글을 작성해주세요..."
                  minRows={3}
                  disabled={submittingComment}
                />
                <Group justify="flex-end">
                  <Button
                    type="submit"
                    leftSection={<IconSend size={16} />}
                    disabled={submittingComment || !commentText.trim()}
                    loading={submittingComment}
                    variant="gradient"
                    gradient={{ from: 'green.5', to: 'green.6' }}
                  >
                    댓글 작성
                  </Button>
                </Group>
              </Stack>
            </form>
          )}

          <Stack gap="md">
            {comments.filter(comment => !comment.parent_id).map((comment, index) => (
              <Card key={comment.id || index} shadow="sm" radius="md" p="md" withBorder>
                <Stack gap="sm">
                  <Group justify="space-between" align="flex-start">
                    <Group>
                      <Avatar color="green" radius="xl" size="sm">
                        {comment.user?.username?.charAt(0) || '?'}
                      </Avatar>
                      <div>
                        <Text size="sm" fw={500}>
                          {comment.user?.username || '알 수 없음'}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {formatDate(comment.created_at)}
                        </Text>
                      </div>
                    </Group>
                  </Group>
                  
                  {editingComment === comment.id ? (
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      handleUpdateComment(comment.id);
                    }}>
                      <Stack gap="sm">
                        <Textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          placeholder="댓글을 수정해주세요..."
                          disabled={submittingComment}
                        />
                        <Group gap="sm">
                          <Button
                            type="submit"
                            size="xs"
                            disabled={submittingComment || !editText.trim()}
                            loading={submittingComment}
                          >
                            수정 완료
                          </Button>
                          <Button
                            variant="light"
                            size="xs"
                            onClick={handleCancelEdit}
                            disabled={submittingComment}
                          >
                            취소
                          </Button>
                        </Group>
                      </Stack>
                    </form>
                  ) : (
                    <>
                      <Text size="sm" c="gray.7" lh={1.6}>
                        {comment.content}
                      </Text>
                      
                      {!comment.is_deleted && (
                        <Group gap="sm">
                          {isLoggedIn && (
                            <Button
                              variant="subtle"
                              size="xs"
                              color="blue"
                              onClick={() => setReplyingTo(comment.id)}
                            >
                              답글
                            </Button>
                          )}
                          {isLoggedIn && user && comment.user?.id === user.id && (
                            <>
                              <Button
                                variant="subtle"
                                size="xs"
                                color="gray"
                                onClick={() => handleEditComment(comment.id, comment.content)}
                              >
                                수정
                              </Button>
                              <Button
                                variant="subtle"
                                size="xs"
                                color="red"
                                onClick={() => handleDeleteComment(comment.id)}
                              >
                                삭제
                              </Button>
                            </>
                          )}
                        </Group>
                      )}
                    </>
                  )}

                  {/* Reply Form */}
                  {replyingTo === comment.id && (
                    <Box mt="md" p="md" style={{ background: 'var(--mantine-color-gray-1)', borderRadius: 'var(--mantine-radius-md)' }}>
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        handleReplySubmit(comment.id);
                      }}>
                        <Stack gap="sm">
                          <Textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder={`${comment.user?.username || '사용자'}님에게 답글을 작성해주세요...`}
                            disabled={submittingComment}
                            size="sm"
                          />
                          <Group gap="sm">
                            <Button
                              type="submit"
                              size="xs"
                              disabled={submittingComment || !replyText.trim()}
                              loading={submittingComment}
                            >
                              답글 작성
                            </Button>
                            <Button
                              variant="light"
                              size="xs"
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyText('');
                              }}
                            >
                              취소
                            </Button>
                          </Group>
                        </Stack>
                      </form>
                    </Box>
                  )}

                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <Box
                      ml="md"
                      pl="md"
                      style={{
                        borderLeft: '3px solid var(--mantine-color-green-3)',
                        background: 'linear-gradient(to right, rgba(34, 197, 94, 0.05), transparent)'
                      }}
                    >
                      <Stack gap="sm">
                        {comment.replies.map((reply, replyIndex) => (
                          <Card key={reply.id || replyIndex} shadow="xs" radius="sm" p="sm" withBorder>
                            <Stack gap="xs">
                              <Group>
                                <Avatar color="green" radius="xl" size="xs">
                                  {reply.user?.username?.charAt(0) || '?'}
                                </Avatar>
                                <div>
                                  <Text size="xs" fw={500}>
                                    {reply.user?.username || '알 수 없음'}
                                  </Text>
                                  <Text size="xs" c="dimmed">
                                    {formatDate(reply.created_at)}
                                  </Text>
                                </div>
                              </Group>
                              
                              {editingComment === reply.id ? (
                                <form onSubmit={(e) => {
                                  e.preventDefault();
                                  handleUpdateComment(reply.id);
                                }}>
                                  <Stack gap="xs">
                                    <Textarea
                                      value={editText}
                                      onChange={(e) => setEditText(e.target.value)}
                                      placeholder="답글을 수정해주세요..."
                                      disabled={submittingComment}
                                      size="xs"
                                    />
                                    <Group gap="xs">
                                      <Button
                                        type="submit"
                                        size="xs"
                                        disabled={submittingComment || !editText.trim()}
                                        loading={submittingComment}
                                      >
                                        수정
                                      </Button>
                                      <Button
                                        variant="light"
                                        size="xs"
                                        onClick={handleCancelEdit}
                                        disabled={submittingComment}
                                      >
                                        취소
                                      </Button>
                                    </Group>
                                  </Stack>
                                </form>
                              ) : (
                                <>
                                  <Text size="xs" c="gray.7" lh={1.5}>
                                    <Badge variant="light" color="green" size="xs" mr="xs">
                                      @{comment.user?.username || '사용자'}
                                    </Badge>
                                    {reply.content}
                                  </Text>
                                  
                                  <Group gap="xs">
                                    {isLoggedIn && (
                                      <Button
                                        variant="subtle"
                                        size="xs"
                                        color="blue"
                                        onClick={() => setReplyingTo(comment.id)}
                                      >
                                        답글
                                      </Button>
                                    )}
                                    {isLoggedIn && user && reply.user?.id === user.id && (
                                      <>
                                        <Button
                                          variant="subtle"
                                          size="xs"
                                          color="gray"
                                          onClick={() => handleEditComment(reply.id, reply.content)}
                                        >
                                          수정
                                        </Button>
                                        <Button
                                          variant="subtle"
                                          size="xs"
                                          color="red"
                                          onClick={() => handleDeleteComment(reply.id)}
                                        >
                                          삭제
                                        </Button>
                                      </>
                                    )}
                                  </Group>
                                </>
                              )}
                            </Stack>
                          </Card>
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Stack>
              </Card>
            ))}
            
            {comments.length === 0 && (
              <Center py="xl">
                <Text size="sm" c="dimmed" fs="italic">
                  아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!
                </Text>
              </Center>
            )}
          </Stack>
        </Stack>
      </Card>

      {/* Image Modal */}
      <Modal
        opened={opened}
        onClose={() => {
          close();
          setSelectedImage(null);
        }}
        size="xl"
        centered
        withCloseButton={false}
        padding={0}
        styles={{
          content: { background: 'transparent' },
          body: { padding: 0 }
        }}
      >
        {selectedImage && (
          <Image
            src={selectedImage}
            alt="확대된 사진"
            style={{
              maxHeight: '90vh',
              maxWidth: '90vw',
              objectFit: 'contain'
            }}
            onClick={() => {
              close();
              setSelectedImage(null);
            }}
          />
        )}
      </Modal>
    </Container>
  );
}

export default PostDetail;