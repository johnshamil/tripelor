export type PropertyRate = { label:string; price:number; note?:string };
export type TripelorProperty = {
  name:string;
  slug:string;
  location:string;
  image:string;
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
    image:"/uhoos/WhatsApp%20Image%202026-08-17%20at%2015.30.23.jpeg",
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
    image:"/images%20(3).jpeg",
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
    image:"https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=85",
    description:"A beachfront Hulhumalé hotel close to Velana International Airport, suitable for stopovers and Maldives arrivals or departures.",
    startingFrom:70,
    currency:"USD",
    bookingMode:"request",
    roomsLabel:"18 rooms",
    rates:[
      {label:"Deluxe Double · RO",price:70,note:"Single occupancy"},
      {label:"Deluxe Double · BB",price:80,note:"Single occupancy"},
      {label:"Deluxe Twin · RO",price:70,note:"Single occupancy"},
      {label:"Deluxe Twin · BB",price:80,note:"Single occupancy"},
      {label:"Sea View · RO",price:100,note:"Single occupancy"},
      {label:"Sea View · BB",price:110,note:"Single occupancy"},
    ],
  },
];
