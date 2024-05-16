import { lazy, Suspense, useEffect, useState } from "react";
import { Button, Navbar, Container, Nav, Row, Col, Card, ButtonGroup, ButtonToolbar, Dropdown, Image, Pagination } from 'react-bootstrap';
import './../App.css';
import { Routes, Route, useNavigate, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios'
import { useQuery } from "react-query";
import { Link } from 'react-router-dom';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import { ref, getDownloadURL } from "firebase/storage";
import { storage } from "../firebaseConfig.js";




function CardItem(props) {
  
  const [isHovered, setHovered] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    // API 요청을 통해 데이터를 가져옵니다.
    axios.get(`${process.env.REACT_APP_API_URL}/clothes_images/${props.products.clothesId}`)
      .then(response => {

        // order가 1인 객체를 찾습니다.
        const orderOneImage = response.data.find(item => item.order === 1);

        // 찾은 객체의 imageUrl을 상태에 저장합니다.
        if (orderOneImage) {
          setImageUrl(orderOneImage.imageUrl);
        }
      })
      .catch(error => console.log(error));
  }, [props.products]); // 빈 의존성 배열을 넣어 컴포넌트 마운트 시 한 번만 실행되도록 합니다.

  if (!props.products) {
    // product가 없으면 빈 컴포넌트를 렌더링하거나, 로딩 표시 등의 처리를 할 수 있습니다.
    return <div>Loading...</div>;
  }
  
  const cardStyle = {
    height: '350px', // 고정된 높이 설정
    transition: 'box-shadow 0.3s', // 마우스 호버 시 표시되는 효과 설정
    boxShadow: isHovered ? '0 0 10px rgba(0,0,0,0.5)' : 'none', // 마우스 호버 시 box-shadow 변경
    marginBottom: '5px'
  };



  return (
    <Col xs={4} md={3} onClick={() => { props.navigate('/detail/' + props.products.clothesId) }}>
      <Card style={cardStyle} className="border-0" onMouseOver={() => setHovered(true)} onMouseOut={() => setHovered(false)}>
        <Card.Img
          src={imageUrl}
          style={{
            width: "100%", // 이미지의 너비를 카드에 맞춤
            height: "200px", // 고정된 높이 설정
            objectFit: "cover" // 이미지가 비율을 유지하며 지정된 영역을 채우도록 함
          }}
          loading="lazy"
        />

        <Card.Body style={{textAlign:'left'}}>
        <Card.Text style={{fontWeight: '700' }}>
            {props.products.companyName}
          </Card.Text>
          <Card.Title> {props.products.name} </Card.Title>
          
          <Card.Text style={{fontWeight: '700' }}>
            {props.products.price.toLocaleString()}원
          </Card.Text>
        </Card.Body>
      </Card>
    </Col>
  );
}

export default CardItem;