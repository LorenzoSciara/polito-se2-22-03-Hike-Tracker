import React, { useState, useEffect } from "react";
import { Col, Container, Button, Row, Modal } from 'react-bootstrap';
import { Link, useNavigate } from "react-router-dom";
import { HikeGrid } from "./../components/hikeList";
import { HikeFilterForm } from "./../components/hikeFilterForm";
import EmergencyOperator from "./../screens/emergencyOperator"
import API from "../API";

const Home = (props) => {

    const [show, setShow] = useState(false);
    const [filters, setFilters] = useState("[]");
    const [myHikesAuthor, setMyHikesAuthor] = useState("");
    const [coordsFilter, setCoordsFilter] = useState([45.116177, 7.742615]);
    const [radiusFilter, setRadiusFilter] = useState(10); // km+
    const [preferences, setPreferences] = useState(undefined);
    const navigate = useNavigate();
    
    const [windowSize, setWindowSize] = useState(getWindowSize());
    function getWindowSize() {
        const { innerWidth, innerHeight } = window;
        return { innerWidth, innerHeight };
    }

    useEffect(() => {
        if(props.user !== undefined){
            async function getPrefs () {
                try {
                    const prefs = await API.getPreferences();
                if (Object.keys(prefs.body).length === 0)
                    setPreferences(undefined);
                else
                    setPreferences(prefs.body);
                } catch (err) {
                    console.log(err);
                }
            }
    
            /* Temporary patch to make the filters reset upon logout */
            if(props.user === undefined)
                resetFilters();
            getPrefs();
        }
        
    }, [props.user]);

    const suggestHikes = async () => {
        const prefs = await API.getPreferences();
        const minAscent = 0.9 * Number(prefs.body.ascent);
        const maxAscent = 1.1 * Number(prefs.body.ascent);
        const minDuration = 0.9 * Number(prefs.body.duration);
        const maxDuration = 1.1 * Number(prefs.body.duration);
        let filters = [];
        filters.push({ key: "minAscent", value: minAscent });
        filters.push({ key: "maxAscent", value: maxAscent });
        filters.push({ key: "minTime", value: minDuration });
        filters.push({ key: "maxTime", value: maxDuration });
        setFilters(JSON.stringify(filters));
    }

    const resetFilters = () => {
        setFilters(JSON.stringify([]));
    }

    return (
        <Container>
            <Row>
                <Col>
                {myHikesAuthor === ""?
                    <h1 id="title">Hike List</h1>
                    :<h1 id="title">Viewing your Hikes</h1>
                }
                    
                </Col>
                <Col style={{display:"flex", flexDirection: (windowSize.innerWidth<550)?"column":"row", justifyContent:"flex-end"}}>
                        {
                            (props.user && props.user.role === "hiker") &&
                            <Button id='suggested-hike-button' onClick={() => suggestHikes()} variant="light" size="lg" disabled={preferences === undefined}>{" "}Suggested hikes</Button>
                        }
                        {
                            (props.user && props.user.role === "guide") &&
                            <Button id='my-hikes-button' 
                                onClick={() => setMyHikesAuthor(auth => {
                                    if(auth==="")return(props.user.email);
                                    return("");
                                })} 
                                variant="light" size="lg">{" "}{myHikesAuthor!=="" ? "My Hikes ☑" : "My Hikes ☐"}</Button>
                        }
                        <Button id='reset-filter-button' onClick={() => {resetFilters(); setMyHikesAuthor("")}} variant="light" size="lg">{" "}Reset filters</Button>
                        <Button id='filter-button' onClick={() => setShow(true)} variant="light" size="lg"><i className="bi bi-sliders"></i>{" "}Filter</Button>
                   
                </Col>
                
            </Row>

            <ul></ul>
            <Row>
                <HikeGrid myHikesAuthor={myHikesAuthor} filters={filters} coordsFilter={coordsFilter} radiusFilter={radiusFilter} user={props.user} setProps={props.setProps} />
            </Row>

            <Modal show={show} onHide={() => setShow(false)} animation={false} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title id='filter-title'>Filter Selection</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <HikeFilterForm setShow={setShow} setFilters={setFilters} setCoords={setCoordsFilter} setRadiusFilter={setRadiusFilter} />
                </Modal.Body>
            </Modal>
        </Container>
    );
}

const styles = {
    "container": {
        display: "flex",
        flexDirection: "column",
    }
}

export default Home;