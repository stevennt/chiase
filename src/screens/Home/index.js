import React, { useEffect, useState } from 'react';
import { Center, Spinner, Image, Flex, Text, Button, Heading, Box, HStack, Divider, VStack, CloseButton, Checkbox } from '@chakra-ui/react';
import {
    useToast
} from "@chakra-ui/react";
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import NavigationFooter from '../../components/NavigationFooter';
import {
    GoogleMap,
    useLoadScript,
    Marker,
    useJsApiLoader
} from '@react-google-maps/api';
import mapStyles from "../../utils/googleMapsStyle";
import * as BDGraphics from '../../assets/';
import foodbanks from '../FoodBanks/foodbanks.json';

import * as BDAPI from '../../api/index'
import axios from 'axios';
import { useTranslation } from 'react-i18next';

require('dotenv').config()

const Home = () => {
    const history = useHistory();
    const { t } = useTranslation();
    const accessToken = useSelector(state => state.auth.accessToken);
    const toast = useToast();
    //const [center, setCenter] = useState({ lat: 3.145081052343874, lng: 101.70524773008304 })
    const [center, setCenter] = useState({ lat: 10.85082371699439, lng: 106.689939585535 })
    const [flags, setFlags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMarker, setSelectedMarker] = useState(null);
    const [selectedFoodbank, setSelectedFoodbank] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [foodbankModalVisible, setFoodbankModalVisible] = useState(false);
    const [showFoodbanks, setShowFoodBanks] = useState(true);
    const [showSOS, setShowSOS] = useState(true);
    const [map, setMap] = useState(null);
    const [libraries] = useState(['places']);

    const mapContainerStyle = {
        width: '100vw',
        height: '100vh'
    }
    const options = {
        styles: mapStyles,
        disableDefaultUI: true,
        zoomControl: true
    }
    const {isLoaded, loadError} = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
        libraries
    })

    const onLoad = React.useCallback(function callback(map) {
        setMap(map);
    }, [])

    const onUnmount = React.useCallback(function callback(map) {
        setMap(null);
    }, [])

    useEffect(() => {
        axios.get(`${process.env.REACT_APP_API_URL}flag/getall`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        })
            .then(async (res) => {
                let flags = res.data
                flags.forEach(async(flag) => {
                    let newInfoBoxObj = {
                        flag_id: flag.id,
                        lat: flag.coordinates.coordinates[0],
                        lng: flag.coordinates.coordinates[1],
                        description: flag.description ?? "",
                        phonenumber: flag.phonenumber ?? "",
                        createdAt: flag.createdAt
                    }

                    let imageURL;

                    // we don't have enough money so we have to switch between buckets
                    if(flag.image !== null) {
                        imageURL = 'https://minio-server.sambalsos.com:9000/reports/' + flag.image.split('/')[flag.image.split('/').length - 1];
                    } else {
                        imageURL = flag.minioimage;
                    }

                    newInfoBoxObj.image = imageURL;

                    setFlags((oldFlags) => [
                        ...oldFlags,
                        newInfoBoxObj
                    ]);
                })
                setLoading(false)
            })
            .catch((err) => {
                toast({
                    title: "Failed to Load",
                    description: "Something went wrong on our side!",
                    status: "error",
                    duration: 10000000000000,
                    isClosable: false,
                    position: 'top'
                })
            })
    }, []);

    const InfoBoxTemplate = (latitude, longitude, image) => {
        let googleMapUrl = `http://maps.google.com/?q=${latitude},${longitude}`;
        return(
            <div style={{ backgroundColor:"white", padding:'10px', borderRadius: '8px', fontSize:'15px' }} >
                <a target="_blank" href={googleMapUrl} >
                    <p>Go to google maps</p>
                </a>

                <img width="125px" src={image} alt="image url" />
            </div>
        )
    }

    const toastOpener = () => {
        toast({
            title: "This feature is coming soon",
            status: "warning",
            duration: 1500,
            isClosable: true,
            position: 'top'
        })
    }

    const getLowestQuality = (url) => {
        console.log(url.split('https://res.cloudinary.com/benderaputihapp/image/upload/'));
        if(url.includes('benderaputihapp')) {
            let newURL = 'https://res.cloudinary.com/benderaputihapp/image/upload/q_20/' + url.split('https://res.cloudinary.com/benderaputihapp/image/upload/')[1]
            return newURL;
        } else if (url.includes('sambal-sos')) {
            let newURL = 'https://res.cloudinary.com/sambal-sos/image/upload/q_20/' + url.split('https://res.cloudinary.com/sambal-sos/image/upload/')[1]
            return newURL;
        } else {
            return url;
        }
    }

    return (
        <div>
            {
                ( loading || !isLoaded ) ?
                    <Center h="80vh" flexDirection="column" justifyContent="center" alignItems="center" >
                        <Spinner />
                    </Center>
                :
                    <GoogleMap mapContainerStyle={mapContainerStyle} zoom={8} center={center} onLoad={onLoad} onUnmount={onUnmount} options={options} onClick={() => {
                        setModalVisible(false);
                        setFoodbankModalVisible(false);
                    }} >
                        {
                        flags.map((flag, index) => {
                            return (
                                <Marker
                                    visible={showSOS}
                                    key={index}
                                    position={{ lat: parseFloat(flag.lat), lng: parseFloat(flag.lng) }}
                                    icon={{
                                        url: '/siren.svg',
                                        scaledSize: new window.google.maps.Size(30, 30),
                                        origin: new window.google.maps.Point(0,0),
                                        anchor: new window.google.maps.Point(15, 15)
                                    }}
                                    onClick={() => {
                                        setSelectedMarker(flag);
                                        setFoodbankModalVisible(false);
                                        setModalVisible(true);
                                    }}
                                />
                            );
                        })
                    }

                        {
                            foodbanks.map((foodbank, index) =>
                                (
                                <Marker
                                    visible={showFoodbanks}
                                    key={index}
                                    position={{ lat: parseFloat(foodbank.address[0].coordinates.latitude), lng: parseFloat(foodbank.address[0].coordinates.longitude) }}
                                    icon={{
                                        url: '/groceries.svg',
                                        scaledSize: new window.google.maps.Size(20, 20),
                                        origin: new window.google.maps.Point(0,0),
                                        anchor: new window.google.maps.Point(10, 10)
                                    }}
                                    onClick={() => {
                                        setSelectedFoodbank(foodbank);
                                        setModalVisible(false);
                                        setFoodbankModalVisible(true);
                                    }}
                                />))
                        }
                    </GoogleMap>
            }
            <Flex flexDirection="column" position="absolute" top="15px" right="15px" borderRadius="8px" py="0.1rem" px="0.8rem" backgroundColor="white" boxShadow="0px 8px 20px rgba(147, 147, 147, 0.25)" justifyContent="center" alignItems="center" >
                <HStack justifyContent="flex-start" alignItems="center" w="100%" py="0.2rem" >
                    <Checkbox isChecked={showFoodbanks} onChange={(e) => setShowFoodBanks(e.target.checked)} />
                    <Image src={BDGraphics.FoodBankIcon} alt="Food Bank Indicator" height="20px" width="20px" mr="10px" />
                    <Text fontFamily="Poppins" fontSize="11px" >{t('home.food-banks')}</Text>
                </HStack>
                <Divider mt="5px" />
                <HStack justifyContent="flex-start" alignItems="center" w="100%" py="0.2rem" >
                    <Checkbox isChecked={showSOS} onChange={(e) => setShowSOS(e.target.checked)} />
                    <Image src={BDGraphics.SirenIcon} alt="SOS Indicator" height="25px" width="25px" mr="10px" />
                    <Text fontFamily="Poppins" fontSize="11px" >{t('home.sos')}</Text>
                </HStack>
            </Flex>
            <Flex borderTopRadius="15px" position="fixed" bottom="100px" width="100%" flexDirection="row" alignItems="center" justifyContent="space-around" backgroundColor="white" padding="20px 20px" >
                <Flex w="48%" justifyContent="center" backgroundColor="#E63946" borderRadius="8px" padding="15px 25px" color="white" fontFamily="Montserrat" fontWeight="600" onClick={() => history.push('/report-flag')}>
                    {t('home.ask-for-help')}
                </Flex>
                <Flex w="48%" justifyContent="center" alignItems="center" boxShadow="0px 8px 20px rgba(147, 147, 147, 0.25)" backgroundColor="white" borderRadius="10px" padding="15px 25px" color="black" fontFamily="Montserrat" fontWeight="500" onClick={() => history.push('/report-flag')} >
                    <Image mr="5px" src={ BDGraphics.FlagIcon } height="11px" />
                    {t('home.report-sos')}
                </Flex>
            </Flex>

            <Flex className="more-details-modal" flexDirection="column" justifyContent="flex-start" alignItems="flex-start" h="55%" mh="55%" w="100%" position="fixed" left="50%" transform="translate(-50%, -50%)" top={ modalVisible ? '60%' : '200%' } backgroundColor="white" borderRadius="8px" padding="0.8rem" overflowY="scroll" transition="all 300ms cubic-bezier(0.740, -0.175, 0.000, 1.080)" transitionTimingFunction="cubic-bezier(0.740, -0.175, 0.000, 1.080)" >
                {
                    selectedMarker ?
                        <>
                            <Flex flexDirection="row" justifyContent="space-between" alignItems="center" padding="1rem" w="100%" >
                                <Heading> SOS Details </Heading>
                                <CloseButton onClick={ () => { setModalVisible(false); setFoodbankModalVisible(false); }} />
                            </Flex>
                            <Center flexDirection="row" justifyContent="flex-start" alignContent="flex-start" padding="1rem">
                                <HStack h="100%" >
                                    <Box maxWidth="50%" px="0.5rem" py="0.5rem" h="100%">
                                        <Image borderRadius="8px" src={ selectedMarker?.image } width="100%" maxWidth="200px" h="100%" marginRight="1rem" />
                                    </Box>
                                    <Center flexDirection="column" justifyContent="flex-start" maxWidth="50%" h="100%" py="0.5rem">
                                        <Flex backgroundColor="#ff8c82" borderRadius="8px" w="100%" mb="5px" py="0.5rem" px="0.5rem" flexDirection="row" justifyContent="center" alignItems="center" marginBottom="1rem" onClick={() => { window.open(`https://www.google.com.my/maps?daddr=${selectedMarker.lat},${selectedMarker.lng}`) }} >
                                            <Image src={ BDGraphics.PinIcon } alt="" height="15px" mr="10px" />
                                            <Text fontSize="13px" >Go to location</Text>
                                        </Flex>
                                        {
                                            selectedMarker.phonenumber ? 
                                            <Flex backgroundColor="#EAEAEA" borderRadius="8px" w="100%" py="0.5rem" px="0.5rem" flexDirection="row" justifyContent="center" alignItems="center" marginBottom="1rem" onClick={() => { window.open(`tel:${selectedMarker.phonenumber}`) }} >
                                                <Image src={ BDGraphics.PhoneIcon } alt="" height="15px" mr="15px" />
                                                <Text fontSize="13px" >Call Phone</Text>
                                            </Flex>
                                            :
                                            <>
                                            </>
                                        }
                                        <Text textAlign="start" fontSize="12px" px="0.5rem" maxW="100%" >{ selectedMarker?.description }</Text>
                                    </Center>
                                </HStack>
                            </Center>
                            <Flex className="button-groups" flexDirection="row" justifyContent="space-around" alignContent="center" padding="1rem" w="100%" >
                                <Box w="100%" mr="10px" onClick={ () => { toastOpener() } }>
                                    <Button fontFamily="Montserrat" fontWeight="600" w="100%" padding="1.5rem" backgroundColor="#5CFFC5" >Up-Vote <Image ml="5px" src={ BDGraphics.UpvoteIcon } height="15px"/> </Button>
                                </Box>
                                <Box w="100%" onClick={ () => { toastOpener() } } >
                                    <Button fontFamily="Montserrat" fontWeight="600" w="100%" padding="1.5rem" backgroundColor="#FFECA7" >Supported <Image ml="5px" src={ BDGraphics.SupportedIcon } height="15px"/> </Button>
                                </Box>
                            </Flex>
                        </>
                    :
                        <Text>No Selected Marker</Text>
                }

            </Flex>

            <Flex className="foodbank-details-modal" flexDirection="column" justifyContent="flex-start" alignItems="flex-start" h="55%" mh="55%" w="100%" position="fixed" left="50%" transform="translate(-50%, -50%)" top={ foodbankModalVisible ? '60%' : '200%' } backgroundColor="white" borderRadius="8px" padding="0.8rem" overflowY="scroll" transition="all 300ms cubic-bezier(0.740, -0.175, 0.000, 1.080)" transitionTimingFunction="cubic-bezier(0.740, -0.175, 0.000, 1.080)" >
                {
                    selectedFoodbank ?
                        <VStack textAlign="center" width="100%" spacing={5}>
                            <Flex flexDirection="row" justifyContent="space-between" alignItems="center" padding="1rem" w="100%" >
                                <Heading> Food Banks Details </Heading>
                                <CloseButton onClick={ () => { setModalVisible(false); setFoodbankModalVisible(false); }} />
                            </Flex>
                            <VStack padding="0.5rem">
                                <Heading as="h5" fontSize="md">{selectedFoodbank?.name}</Heading>
                                <Text>{selectedFoodbank?.address[0]?.fullAddress}</Text>
                                <VStack flexDirection="column" justifyContent="flex-start" maxWidth="70%" h="100%" py="0.5rem">
                                            <Button colorScheme="teal" onClick={() => {
                                                window.open(`https://www.google.com.my/maps?daddr=${selectedFoodbank?.address[0]?.coordinates?.latitude},${selectedFoodbank?.address[0]?.coordinates?.longitude}`);
                                            }}>
                                                Go to location
                                            </Button>
                                            {
                                                selectedFoodbank?.website !== "" &&
                                                <Button onClick={() => {
                                                    window.open(selectedFoodbank?.website);
                                                }} >Go to the website</Button>
                                            }
                                </VStack>
                            </VStack>
                        </VStack>
                    :
                        <Text>No Selected Marker</Text>
                }

            </Flex>


            <NavigationFooter activeTab={0} />
        </div>
    );
};

export default React.memo(Home);