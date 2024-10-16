import { Container, Navbar, NavbarBrand } from "react-bootstrap";

function Navigation() {
  return (
    <Navbar className="bg-body-tertiary">
      <Container>
        <NavbarBrand>ControlMe Admin</NavbarBrand>
      </Container>
    </Navbar>
  );
}

export default Navigation;
