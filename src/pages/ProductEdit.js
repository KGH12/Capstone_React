import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Form, Button, Spinner, Image } from 'react-bootstrap';
import { FaPlusCircle } from "react-icons/fa";
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import "firebase/firestore";
import { storage } from "../firebaseConfig.js";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getStorage, deleteObject } from "firebase/storage";


let StyledButton = styled.button`
  
  background-color: #000; /* 검은색 배경 */
  color: #fff; /* 흰색 텍스트 */
  border: none; /* 테두리 없음 */
  padding: 10px 100px; /* 내부 여백 */
  height: 50px;
  font-size: 1rem; /* 글자 크기 */
  font-weight: bold; /* 글자 굵기 */
  cursor: pointer; /* 마우스 오버시 커서 변경 */
//   border-radius: 5px; /* 모서리 둥글게 */
  transition: background-color 0.3s ease; /* 호버 효과를 위한 전환 */
  margin-bottom: 10px;

  &:hover {
    background-color: #333; /* 호버시 배경색 변경 */
  }
`;

function ProductEdit(props) {

    let { editId } = useParams();

    // 접근제한
    // 등록한 사람이 아니면 접근못함 + 로그인한 사람만

    let navigate = useNavigate();
    let dispatch = useDispatch();
    let { sellerInfo, isLoggedIn } = useSelector((state) => state.seller);

    const [loading, setLoading] = useState(false);  // 로딩 상태 관리

    const [category, setCategory] = useState({
        name: '',
        detail: '',
        price: '',
        genderCategory: 0,
        majorCategoryId: '',
        subCategoryId: '',
        sellerEmail: ''
    });
    const [displayPrice, setDisplayPrice] = useState('');

    const [productDetails, setProductDetails] = useState([{
        color: '',
        size: '',
        remaining: 0,
        clothesId: 0
    }]);

    const [clothesImages, setClothesImages] = useState([{
        clothesId: '',
        imageUrl: '',
        order: 0,
    }]);

    // 썸네일 이미지(주문 번호 1)와 추가 이미지(주문 번호 1이 아닌 것들) 필터링
    const thumbnailImage = clothesImages.find(image => image.order === 1);
    const additionalImages = clothesImages.filter(image => image.order !== 1);

    const [majorCategories, setMajorCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);

    useEffect(() => {

        axios.get(`${process.env.REACT_APP_API_URL}/clothes/${editId}`)
        .then(response => {
            const fetchedCategory = response.data;
            const formattedPrice = fetchedCategory.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

            setCategory({
                ...fetchedCategory,
                price: fetchedCategory.price.toString()  // API로부터 받은 숫자를 문자열로 변환하여 저장
            });
            setDisplayPrice(formattedPrice);  // 포맷된 가격을 displayPrice로 설정

            if (sellerInfo.email_id !== fetchedCategory.sellerEmail) {
                alert('이 상품의 등록자만 접근할 수 있습니다.');
                navigate('/seller');
            }
        })
        .catch(error => {
            console.error("상품 정보 불러오기 실패", error);
        });


        axios.get(`${process.env.REACT_APP_API_URL}/detail/clothes/${editId}`)
            .then(response => {
                const productDetailsData = response.data;
                setProductDetails(productDetailsData);

            })
            .catch(error => {
                console.error("상품 상세 정보 불러오기 실패", error);
            });

        axios.get(`${process.env.REACT_APP_API_URL}/clothes_images/${editId}`)
            .then(response => {
                const clothesImagesData = response.data;
                setClothesImages(clothesImagesData);
            })
            .catch(error => {
                console.error("상품 상세 정보 불러오기 실패", error);
            });
    }, [editId, navigate, sellerInfo.email_id]);



    // 대분류 카테고리 데이터를 서버에서 가져오기
    useEffect(() => {
        axios.get(`${process.env.REACT_APP_API_URL}/major_category`)
            .then(response => {
                setMajorCategories(response.data);
            })
            .catch(error => {
                console.error('Major categories fetching error:', error);
            });
    }, []);

    // 대분류 카테고리 선택 시 소분류 카테고리 데이터 가져오기
    useEffect(() => {
        if (category.majorCategoryId) {
            axios.get(`${process.env.REACT_APP_API_URL}/sub_category/major_category/${category.majorCategoryId}`)
                .then(response => {
                    setSubCategories(response.data);
                })
                .catch(error => {
                    console.error('Sub categories fetching error:', error);
                });
        }
    }, [category.majorCategoryId]);



    const handleCategoryChange = e => {
        const { name, value } = e.target;
        setCategory(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handlePriceChange = (e) => {
        const value = e.target.value.replace(/\D/g, ''); // 숫자가 아닌 모든 문자 제거
        const formattedValue = value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        setDisplayPrice(formattedValue); // 화면에 보여줄 값 업데이트
        setCategory(prevState => ({
            ...prevState,
            price: value  // 실제 저장될 숫자 값 업데이트
        }));
    };    

    // 대분류 변경 이벤트 핸들러
    const handleMajorCategoryChange = (e) => {
        setCategory(prevState => ({
            ...prevState,
            majorCategoryId: e.target.value,
            subCategoryId: '', // 대분류가 변경될 때 소분류 초기화
        }));
    };

    // 소분류 변경 이벤트 핸들러
    const handleSubCategoryChange = (e) => {
        setCategory(prevState => ({
            ...prevState,
            subCategoryId: e.target.value,
        }));
    };

    const handleProductDetailChange = (e, index) => {
        const { name, value } = e.target;
        const list = [...productDetails];
        list[index] = { ...list[index], [name]: value };
        setProductDetails(list);
    };

    const handleAddProductDetail = () => {
        setProductDetails([...productDetails, { color: '', size: '', remaining: 0, clothesId: 0, isNew: true }]);
    };

    const handleRemoveProductDetail = async (index, productDetail) => {
        if (productDetail.detailId && !productDetail.isNew) {
            try {
                await axios.delete(`${process.env.REACT_APP_API_URL}/detail/${productDetail.detailId}`);
                console.log("데이터베이스에서 제거 완료.");
                alert('옵션 제거 완료');
            } catch (error) {
                console.error("옵션 제거 실패: ", error);
            }
        }
        const list = [...productDetails];
        list.splice(index, 1);
        setProductDetails(list);
    };


    const handleUploadImages = async (files) => {
        // FileList 객체를 배열로 변환
        const filesArray = files instanceof FileList ? Array.from(files) : [files];

        const uploadPromises = filesArray.map((file, index) => {
            const now = new Date();
            const timestamp = now.getTime();
            const fileName = `${timestamp}-${index}-${file.name}`;
            const firebasePath = ref(storage, `images/${fileName}`);

            return uploadBytes(firebasePath, file)
                .then(uploadResult => getDownloadURL(uploadResult.ref));
        });

        // 파일 업로드를 동시에 처리하고, 모든 URL을 반환
        return Promise.all(uploadPromises);
    };


    const handleImageOrderChange = (index, e) => {
        const updatedImages = clothesImages.map((img, idx) => {
            if (idx === index) {
                return { ...img, order: parseInt(e.target.value, 10) };
            }
            return img;
        });
        setClothesImages(updatedImages);
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);  // 제출 시작 시 로딩 상태를 true로 설정

        // 추가 이미지 파일들
        const additionalFiles = document.querySelector('#additionalImages').files;

        try {
            let additionalImageUrls = [];
            if (additionalFiles.length > 0) {
                additionalImageUrls = await handleUploadImages(additionalFiles);
            }

            // Category 정보를 서버로 전송하고 응답을 받음
            const categoryResponse = await axios.put(`${process.env.REACT_APP_API_URL}/clothes/${editId}`, category);
            console.log('Category Response:', categoryResponse.data);

            // 상품의 category 등록에 성공한 후, 각 detail 등록
            const updates = productDetails.map(detail => {
                if (detail.isNew) {
                    return axios.post(`${process.env.REACT_APP_API_URL}/detail`, {
                        ...detail,
                        clothesId: editId
                    });
                } else {
                    return axios.put(`${process.env.REACT_APP_API_URL}/detail/${detail.detailId}`, {
                        ...detail,
                        clothesId: editId
                    });
                }
            });

            // 이미지 순서도 업데이트
            await axios.put(`${process.env.REACT_APP_API_URL}/clothes_images`, clothesImages);

            // 나머지 이미지들 처리
            if (additionalImageUrls.length > 0) {
                await Promise.all(additionalImageUrls.map((imageUrl, index) => {
                    return axios.post(`${process.env.REACT_APP_API_URL}/clothes_images`, {
                        clothesId: editId,
                        imageUrl: imageUrl,
                        order: clothesImages.length + index + 1 // 추가 이미지들에 대해 순서 설정 (이미지 개수 +1 부터 시작)
                    });
                }));
            }

            alert('상품 수정이 완료되었습니다.');
            window.location.reload();  // 페이지를 새로고침

        } catch (error) {
            console.error('Submitting error:', error);
            setLoading(false);
            alert('상품 수정에 실패했습니다.');
        }

        setLoading(false);
    };





    const handleRemoveImage = async (index) => {
        const image = clothesImages[index];
        if (!image || !image.imageUrl) return;

        const storage = getStorage();
        // Firebase Storage 내 파일 참조 생성
        const imageRef = ref(storage, image.imageUrl);

        try {
            // Firebase Storage에서 이미지 삭제
            await deleteObject(imageRef);
            console.log("Image deleted successfully from Firebase Storage");

            // 성공적으로 이미지를 삭제한 후, 데이터베이스에서 이미지 정보 삭제 요청
            await axios.delete(`${process.env.REACT_APP_API_URL}/clothes_images/${image.clothesId}/${image.order}`)
                .then(() => {
                    console.log("Image record deleted successfully from the database");
                    axios.get(`${process.env.REACT_APP_API_URL}/clothes_images/${image.clothesId}`)
                        .then((result) => {
                            setClothesImages(result.data);
                            alert('이미지 제거 완료');
                        })
                        .catch(() => {
                            console.log("이미지 불러오기 실패");
                        })
                })

        } catch (error) {
            console.error("Error removing image: ", error);
        }
    };

    return (

        <form onSubmit={handleSubmit}>
            <br />

            <Container>
            <Row className="justify-content-center">
                    <Col>
                        <br /> <br />
                        <h1 style={{ fontSize: '30px', fontWeight: '700' }}>상품 수정</h1>
                        <br /><br />
                    </Col>
                </Row>
                <Row className="mb-3 justify-content-center">
                    <Form.Group as={Row} controlId="formProductName">
                        <Form.Label column sm="2">이름</Form.Label>
                        <Col sm="10">
                            <Form.Control type="text" name="name" value={category.name} onChange={handleCategoryChange} />
                        </Col>
                    </Form.Group>
                </Row>
                {/* 상세 설명 */}
                <Row className="mb-3 justify-content-center">
                    <Form.Group as={Row} controlId="formProductDetail">
                        <Form.Label column sm="2">상세 설명</Form.Label>
                        <Col sm="10">
                            <Form.Control type="text" name="detail" value={category.detail} onChange={handleCategoryChange} />
                        </Col>
                    </Form.Group>
                </Row>

                {/* 가격 */}
                <Row className="mb-3 justify-content-center">
                    <Form.Group as={Row} controlId="formPrice">
                        <Form.Label column sm="2">가격</Form.Label>
                        <Col sm="10">
                            <Form.Control type="text" name="price" value={displayPrice} onChange={handlePriceChange} />
                        </Col>
                    </Form.Group>
                </Row>

                <Row className="mb-3 justify-content-center">
                    <Form.Group as={Row} controlId="formGenderCategory">
                        <Form.Label column sm="2">성별 카테고리</Form.Label>
                        <Col sm="10">
                            <Form.Select
                                name="genderCategory"
                                value={category.genderCategory}
                                onChange={handleCategoryChange}
                            >
                                <option value="">성별 선택</option>
                                <option value="0">남자</option>
                                <option value="1">여자</option>
                                <option value="2">성별무관</option>
                            </Form.Select>
                        </Col>
                    </Form.Group>
                </Row>


                {/* 대분류 선택 */}
                <Row className="mb-3 justify-content-center">
                    <Form.Group as={Row} controlId="formMajorCategory">
                        <Form.Label column sm="2">대분류</Form.Label>
                        <Col sm="10">
                            <Form.Select
                                value={category.majorCategoryId} onChange={handleMajorCategoryChange}>
                                <option value="">대분류 선택</option>
                                {majorCategories.map((cat) => (
                                    <option key={cat.majorCategoryId} value={cat.majorCategoryId}>{cat.name}</option>
                                ))}
                            </Form.Select>
                        </Col>
                    </Form.Group>
                </Row>

                {/* 소분류 선택 */}
                <Row className="mb-3 justify-content-center">
                    <Form.Group as={Row} controlId="formSubCategory">
                        <Form.Label column sm="2">소분류</Form.Label>
                        <Col sm="10">
                            <Form.Select
                                value={category.subCategoryId} onChange={handleSubCategoryChange} disabled={!category.majorCategoryId}>
                                <option value="">소분류 선택</option>
                                {subCategories.map((cat) => (
                                    <option key={cat.subCategoryId} value={cat.subCategoryId}>{cat.name}</option>
                                ))}
                            </Form.Select>
                        </Col>
                    </Form.Group>
                </Row>

                <Row>
                    <Col md={{ offset: 11, span: 1 }} xs={{ offset: 10, span: 2 }}>
                        <button type="button" style={{ background: 'white', border: '0px' }} onClick={handleAddProductDetail}>
                            <FaPlusCircle size={30} />
                        </button>
                    </Col>
                </Row>
            </Container>

            {productDetails.map((productDetail, index) => (
                <Container key={index} className="mb-3">
                    <Row>
                        <Col md={4}>
                            <Form.Group controlId={`color-${index}`}>
                                <Form.Label>색상</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="color"
                                    value={productDetail.color}
                                    onChange={(e) => handleProductDetailChange(e, index)} />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group controlId={`size-${index}`}>
                                <Form.Label>사이즈</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="size"
                                    value={productDetail.size}
                                    onChange={(e) => handleProductDetailChange(e, index)} />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group controlId={`remaining-${index}`}>
                                <Form.Label>재고</Form.Label>
                                <Form.Control
                                    type="number"
                                    name="remaining"
                                    value={productDetail.remaining}
                                    onChange={(e) => handleProductDetailChange(e, index)} />
                            </Form.Group>
                        </Col>
                        <Col md={1} className="align-self-center" style={{ marginTop: '30px' }}>
                            {productDetails.length > 1 && (
                                <Button variant="danger" onClick={() => handleRemoveProductDetail(index, productDetail)}>&#x2715;</Button>
                            )}
                        </Col>
                    </Row>

                </Container>
            ))}
            <br></br><br></br>
            <Container>
                <Row>
                    {clothesImages
                        .sort((a, b) => a.order - b.order) // order 값에 따라 배열을 정렬
                        .map((image, index) => (
                            <Container key={index} className="mb-3">
                                <Row>
                                    <Col md={4}>
                                        <Image src={image.imageUrl} rounded style={{ maxWidth: '100px', maxHeight: '100px' }} />
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group controlId={`imageOrder-${index}`}>
                                            <Form.Label>순서</Form.Label>
                                            <Form.Control
                                                type="number"
                                                name="order"
                                                value={image.order}
                                                onChange={(e) => handleImageOrderChange(index, e)} // 추가된 부분
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={3} className="align-self-center">
                                        <Button variant="danger" onClick={() => handleRemoveImage(index)}>&#x2715; 제거</Button>
                                    </Col>
                                </Row>
                            </Container>
                        ))}
                </Row>



                <Row>
                    <Col md={12}><label htmlFor="additionalImages" style={{ fontSize: '20px', fontWeight: '600', marginBottom: '5px' }}>추가 이미지 등록</label>
                        <input type="file" className="form-control" id="additionalImages" multiple /></Col>
                </Row>
                <Row>
                    <Col style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                        <StyledButton onClick={() => { console.log(category) }} type="submit">
                            {loading ? (
                                <span>
                                    <Spinner
                                        as="span"
                                        animation="border"
                                        size="sm"
                                        role="status"
                                        aria-hidden="true"
                                        style={{ marginRight: '5px' }}
                                    />
                                    상품 수정 중...
                                </span>
                            ) : '상품 수정하기'}
                        </StyledButton>
                    </Col>
                </Row>
            </Container>

            <br></br>

        </form >


    );
}

export default ProductEdit;