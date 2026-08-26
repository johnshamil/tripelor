export type PropertyRate = { label:string; price:number; note?:string };
export type TripelorProperty = {
  name:string;
  slug:string;
  location:string;
  images:string[];
  description:string;
  startingFrom:number;
  currency:"USD";
  bookingMode:"instant"|"request";
  roomsLabel?:string;
  rates:PropertyRate[];
};

export const properties:TripelorProperty[] = [
  {
    name:"Uhoo's Lavish Oasis",
    slug:"uhoos-lavish-oasis",
    location:"V. Felidhoo, Maldives",
    images:["/properties/uhoos-lavish-oasis/20250517_193323.jpg","/properties/uhoos-lavish-oasis/20250518_001256.jpg","/properties/uhoos-lavish-oasis/20250518_001936.jpg","/properties/uhoos-lavish-oasis/20250822_104240.jpg"],
    description:"A cozy local-island stay in Felidhoo with two dedicated rooms, flexible meal plans and Tripelor support.",
    startingFrom:85,
    currency:"USD",
    bookingMode:"instant",
    roomsLabel:"2 rooms",
    rates:[
      {label:"Bed & Breakfast",price:85},
      {label:"Half Board",price:95},
      {label:"Full Board",price:115},
    ],
  },
  {
    name:"Masfalhi View Inn",
    slug:"masfalhi-view-inn",
    location:"Maldives",
    images:["/images%20(3).jpeg","/images%20(1).jpeg","/images%20(2).jpeg","/images%20(4).jpeg"],
    description:"A comfortable local-island guesthouse with six rooms and flexible meal plans.",
    startingFrom:97,
    currency:"USD",
    bookingMode:"instant",
    roomsLabel:"6 rooms",
    rates:[
      {label:"Bed & Breakfast",price:97},
      {label:"Half Board",price:110},
      {label:"Full Board",price:130},
    ],
  },
  {
    name:"Rivethi Beach Hotel",
    slug:"rivethi-beach-hotel",
    location:"Hulhumalé, Maldives",
    images:["/properties/rivethi-beach-hotel/1719713475.jpeg","/properties/rivethi-beach-hotel/0584s12000ssx9b685F06_W_1280_853_R5.webp","/properties/rivethi-beach-hotel/604895445.jpg","/properties/rivethi-beach-hotel/816271360.jpg"],
    description:"A beachfront Hulhumalé hotel close to Velana International Airport, ideal for stopovers, arrivals and departures.",
    startingFrom:70,
    currency:"USD",
    bookingMode:"request",
    roomsLabel:"18 rooms",
    rates:[
      {label:"Deluxe Double · RO",price:70,note:"SGL"},
      {label:"Deluxe Double · BB",price:80,note:"SGL"},
      {label:"Deluxe Double · HB",price:100,note:"SGL"},
      {label:"Deluxe Double · FB",price:120,note:"SGL"},
      {label:"Deluxe Double · RO",price:80,note:"DBL"},
      {label:"Deluxe Double · BB",price:90,note:"DBL"},
      {label:"Deluxe Double · HB",price:130,note:"DBL"},
      {label:"Deluxe Double · FB",price:170,note:"DBL"},
      {label:"Deluxe Twin · RO",price:70,note:"SGL"},
      {label:"Deluxe Twin · BB",price:80,note:"SGL"},
      {label:"Deluxe Twin · HB",price:100,note:"SGL"},
      {label:"Deluxe Twin · FB",price:120,note:"SGL"},
      {label:"Deluxe Twin · RO",price:80,note:"DBL"},
      {label:"Deluxe Twin · BB",price:90,note:"DBL"},
      {label:"Deluxe Twin · HB",price:130,note:"DBL"},
      {label:"Deluxe Twin · FB",price:170,note:"DBL"},
      {label:"Sea View · RO",price:100,note:"SGL"},
      {label:"Sea View · BB",price:110,note:"SGL"},
      {label:"Sea View · HB",price:130,note:"SGL"},
      {label:"Sea View · FB",price:150,note:"SGL"},
      {label:"Sea View · RO",price:110,note:"DBL"},
      {label:"Sea View · BB",price:120,note:"DBL"},
      {label:"Sea View · HB",price:160,note:"DBL"},
      {label:"Sea View · FB",price:190,note:"DBL"},
    ],
  },
];
