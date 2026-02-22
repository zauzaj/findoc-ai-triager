InsuranceProvider.find_or_create_by!(slug: "daman")      { |p| p.name = "Daman";           p.full_name = "Daman National Health Insurance Company" }
InsuranceProvider.find_or_create_by!(slug: "axa")        { |p| p.name = "AXA";             p.full_name = "AXA Gulf Insurance" }
InsuranceProvider.find_or_create_by!(slug: "bupa")       { |p| p.name = "Bupa";            p.full_name = "Bupa Arabia" }
InsuranceProvider.find_or_create_by!(slug: "nextcare")   { |p| p.name = "Nextcare";        p.full_name = "Nextcare UAE" }
InsuranceProvider.find_or_create_by!(slug: "metlife")    { |p| p.name = "MetLife";         p.full_name = "MetLife UAE" }
InsuranceProvider.find_or_create_by!(slug: "oman-ins")   { |p| p.name = "Oman Insurance";  p.full_name = "Oman Insurance Company" }
InsuranceProvider.find_or_create_by!(slug: "neuron")     { |p| p.name = "Neuron";          p.full_name = "Neuron Insurance UAE" }
InsuranceProvider.find_or_create_by!(slug: "allianz")    { |p| p.name = "Allianz";         p.full_name = "Allianz Care UAE" }

puts "Seeded #{InsuranceProvider.count} insurance providers"
