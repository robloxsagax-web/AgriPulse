resource "oci_core_vcn" "agripulse" {
  compartment_id = local.compartment_id
  display_name   = "agripulse-vcn"
  cidr_blocks    = [var.vcn_cidr]
  dns_label      = "agripulse"
}

resource "oci_core_internet_gateway" "agripulse" {
  compartment_id = local.compartment_id
  vcn_id         = oci_core_vcn.agripulse.id
  display_name   = "agripulse-igw"
}

resource "oci_core_route_table" "agripulse" {
  compartment_id = local.compartment_id
  vcn_id         = oci_core_vcn.agripulse.id
  display_name   = "agripulse-rt"

  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_internet_gateway.agripulse.id
  }
}

# One explicit security list; the subnet does NOT carry the VCN default list,
# so these rules are the complete ingress surface.
resource "oci_core_security_list" "agripulse" {
  compartment_id = local.compartment_id
  vcn_id         = oci_core_vcn.agripulse.id
  display_name   = "agripulse-sl"

  ingress_security_rules {
    description = "SSH"
    protocol    = "6" # TCP
    source      = var.ssh_allowed_cidr
    tcp_options {
      min = 22
      max = 22
    }
  }

  ingress_security_rules {
    description = "HTTP (Caddy ACME + redirect)"
    protocol    = "6"
    source      = "0.0.0.0/0"
    tcp_options {
      min = 80
      max = 80
    }
  }

  ingress_security_rules {
    description = "HTTPS"
    protocol    = "6"
    source      = "0.0.0.0/0"
    tcp_options {
      min = 443
      max = 443
    }
  }

  ingress_security_rules {
    description = "HTTP/3 (QUIC)"
    protocol    = "17" # UDP
    source      = "0.0.0.0/0"
    udp_options {
      min = 443
      max = 443
    }
  }

  ingress_security_rules {
    description = "Path MTU discovery"
    protocol    = "1" # ICMP
    source      = "0.0.0.0/0"
    icmp_options {
      type = 3
      code = 4
    }
  }

  egress_security_rules {
    destination = "0.0.0.0/0"
    protocol    = "all"
  }
}

resource "oci_core_subnet" "agripulse" {
  compartment_id             = local.compartment_id
  vcn_id                     = oci_core_vcn.agripulse.id
  display_name               = "agripulse-public"
  cidr_block                 = var.subnet_cidr
  dns_label                  = "public"
  route_table_id             = oci_core_route_table.agripulse.id
  security_list_ids          = [oci_core_security_list.agripulse.id]
  prohibit_public_ip_on_vnic = false
}
