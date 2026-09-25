import glasses from '../assets/Avatars/Avatar-Human-Woman-Glasses.png';
import dog from '../assets/Avatars/Avatar-Pet-Dog-ShihTzu.png';
import bunny from '../assets/Avatars/Avatar-Animal-Bunny.png';
import pink from '../assets/Avatars/Avatar-Human-Scientist-Pink.png';
import rock from '../assets/Avatars/Avatar-Human-Music-Rock-on.png';
import green from '../assets/Avatars/Avatar-Human-Scientist-Green.png';
import dino from '../assets/Avatars/Avatar-Dino-Music.png';
import astronaut from '../assets/Avatars/Avatar-Human-Astronaut.png';
import giraffe from '../assets/Avatars/Avatar-Animal-Giraffe.png';
import basketball from '../assets/Avatars/Avatar-Human-Basketball.png';
import corgi from '../assets/Avatars/Avatar-Pet-Dog-Corgi.png';
import tiger from '../assets/Avatars/Avatar-Animal-Tiger.png';
const avatars=[glasses,dog,pink,rock,green,dino,bunny,astronaut,giraffe,basketball,corgi,tiger];
const names=['Emma Johnson','Liam Martinez','Sophia Okonkwo','Noah Okafor','Olivia Petrov','Davis Mason','Amelia Chen','Lucas Wilson','Isla Patel','Ethan Nguyen','Mia Thompson','Oliver Lee'];
export function StudentAvatar({name,large=false}:{name:string;large?:boolean}) {
 const index=names.indexOf(name);
 return <img className={`tr-avatar${large?' tr-avatar-large':''}`} src={avatars[index<0?0:index]} alt=""/>;
}
